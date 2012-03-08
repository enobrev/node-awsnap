
    var aws         = require('aws2js');

    var AWSnap = function(config) {
        this.config = config;
    };

    AWSnap.prototype.getEC2 = function() {
        return aws.load('ec2', this.config.key, this.config.secret);
    };

    AWSnap.prototype.getServersByName = function(sName, fCallback) {
        fCallback = typeof fCallback == 'function' ? fCallback  : function() {};

        var oEC2 = this.getEC2();

        // call something of the EC2 query API
        oEC2.request('DescribeInstances', {
            'Filter.1.Name':    'tag:Name',
            'Filter.1.Value.1': sName
        }, function (error, oResponse) {
            if (error) {
                console.error(error);
            } else {
                if (oResponse.reservationSet !== undefined) {
                    if (oResponse.reservationSet.item !== undefined) {
                        var aInstances = oResponse.reservationSet.item;
                        if (aInstances.length) {
                            var aServers = [];
                            for (var i in aInstances) {
                                var oInstance = aInstances[i].instancesSet.item;

                                if (oInstance.instanceState.name == 'running') {
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
        fCallback = typeof fCallback == 'function' ? fCallback  : function() {};

        var oEC2 = this.getEC2();

        oEC2.request('DescribeInstances', function (error, oResponse) {
        	if (error) {
        		console.error(error);
        	} else {
                if (oResponse.reservationSet !== undefined) {
                    if (oResponse.reservationSet.item !== undefined) {
                        var aInstances = oResponse.reservationSet.item;
                        if (aInstances.length) {
                            var oHosts  = {};
                            for (var i in aInstances) {
                                var oInstance = aInstances[i].instancesSet.item;
                                var oTags     = oInstance.tagSet;
                                var sName     = '';
                                for (var i in oTags) {
                                    if (oTags.item.key == 'Name') {
                                        sName = oTags.item.value;
                                        break;
                                    }
                                }

                                if (sName.length) {
                                    if (oHosts[sName] === undefined) {
                                        oHosts[sName] = {name: sName, servers: []}
                                    }

                                    oHosts[sName].servers.push(oInstance.ipAddress);
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