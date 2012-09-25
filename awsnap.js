var aws         = require('aws.js');

var AWSnap = function(config) {
    this.config = config;
};

AWSnap.prototype.getEC2 = function() {
    return  aws.createClient(this.config.secret, this.config.key, 'ec2.amazonaws.com');
};

AWSnap.prototype.getActivePrivateServerIPsByName = function(sName, fCallback) {
    fCallback = typeof fCallback == 'function' ? fCallback  : function() {};

    var oEC2 = this.getEC2();

    // call something of the EC2 query API
    oEC2.run('/', 'DescribeInstances', {
        'Filter.1.Name':    'tag:Name',
        'Filter.1.Value.1': sName,
        'Filter.2.Name':    'instance-state-name',
        'Filter.2.Value.1': 'running'
    }, function (error, oResponse) {
        if (error) {
            console.error(error);
        } else {
            if (oResponse.reservationSet !== undefined) {
                if (oResponse.reservationSet.item !== undefined) {
                    var aInstanceSets = oResponse.reservationSet.item;

                    if (!Array.isArray(aInstanceSets)) {
                        aInstanceSets = [aInstanceSets];
                    }

                    if (aInstanceSets.length) {
                        var aServers = [];
                        for (var i in aInstanceSets) {
                            var aInstanceSet = aInstanceSets[i].instancesSet.item;

                            if (!Array.isArray(aInstanceSet)) {
                                aInstanceSet = [aInstanceSet];
                            }

                            for (var j in aInstanceSet) {
                                var oInstance = aInstanceSet[j];
                                aServers.push(oInstance.privateIpAddress);
                            }
                        }

                        fCallback(aServers);
                    }
                }
            }
        }
    });
};

AWSnap.prototype.getServerIPsGroupedByName = function(fCallback) {
    return this.getServerFieldsGroupedByName('ipAddress', fCallback);
};

AWSnap.prototype.getServerFieldsGroupedByName = function(aFields, fCallback) {
    fCallback = typeof fCallback == 'function' ? fCallback  : function() {};

    if (!Array.isArray(aFields)) {
        aFields = [aFields];
    }

    var oEC2 = this.getEC2();

    oEC2.run('/', 'DescribeInstances', {
        'Filter.1.Name':    'instance-state-name',
        'Filter.1.Value.1': 'running'
    }, function (error, oResponse) {
    	if (error) {
    		console.error(error);
    	} else {
            if (oResponse.reservationSet !== undefined) {
                if (oResponse.reservationSet.item !== undefined) {
                    var aInstanceSets = oResponse.reservationSet.item;

                    if (!Array.isArray(aInstanceSets)) {
                        aInstanceSets = [aInstanceSets];
                    }

                    if (aInstanceSets.length) {
                        var oHosts  = {};
                        for (var i in aInstanceSets) {
                            var aInstanceSet = aInstanceSets[i].instancesSet.item;

                            if (!Array.isArray(aInstanceSet)) {
                                aInstanceSet = [aInstanceSet];
                            }

                            for (var j in aInstanceSet) {
                                var oInstance = aInstanceSet[j];

                                var oTags     = oInstance.tagSet;
                                var sName     = '';
                                for (var k in oTags) {
                                    var aTags = oTags[k];

                                    if (!Array.isArray(aTags)) {
                                        aTags = [aTags];
                                    }

                                    for (var m in aTags) {
                                        var oTag = aTags[m];
                                        if (oTag.key == 'Name') {
                                            sName = oTag.value;
                                            break;
                                        }
                                    }
                                }

                                if (sName.length) {
                                    if (oHosts[sName] === undefined) {
                                        oHosts[sName] = {name: sName, servers: []}
                                    }

                                    if (aFields.length == 1) {
                                        oHosts[sName].servers.push(oInstance[aFields[0]]);
                                    } else {
                                        var oValue = {};
                                        for (var i in aFields) {
                                            oValue[aFields[i]] = oInstance[aFields[i]];
                                        }

                                        oHosts[sName].servers.push(oValue);
                                    }
                                }
                            }
                        }

                        fCallback(oHosts);
                    }
                }
            }
    	}
    });
};

module.exports = AWSnap;