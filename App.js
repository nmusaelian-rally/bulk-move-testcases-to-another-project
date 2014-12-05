Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        var that = this;
        var c = Ext.create('Ext.panel.Panel', {
            title: 'click on Date, select Source Project, verify results, select Source Project ',
            layout: 'hbox',
            items: [
                {
                    xtype: 'rallydatepicker',
                    margin: 10,
                    handler: function(picker, date) {
                        if(that.down('#tc')) {
                            Ext.getCmp('testcases-string').destroy();
                        }
                        that._onDateSelected(date);
                    }
                },
                {
                    xtype: 'rallyprojectpicker',
                    fieldLabel: 'select source project',
                    id: 'sourceproject',
                    itemId:'sourceproject',
                    disabled: 'true',
                    margin: 10,
                    listeners:{
                        change: function(combobox){
                            if(this.down('#tc')) {
                                 Ext.getCmp('testcases-string').destroy();
                            }
                                this._onSourceSelected(combobox.getSelectedRecord().get('_ref'));
                        },
                        scope: this
                    }
                },
                {
                    xtype: 'rallyprojectpicker',
                    fieldLabel: 'select destination project',
                    itemId:'destinationproject',
                    id:'destinationproject',
                    disabled: 'true',
                    margin: 10,
                    listeners:{
                        change: function(combobox){
                            if(this.down('#tc')) {
                                Ext.getCmp('testcases-string').destroy();
                            }
                            this._onDestinationSelected(combobox.getSelectedRecord().get('_ref'));
                        },
                        scope: this
                    }
                },
                {
                    xtype: 'rallybutton',
                    id: 'movebuttton',
                    text: 'Move',
                    disabled:true,
                    margin: 15,
                    handler: function() {
                        that._move();
                    }
                }


            ]
        });
        this.add(c);
    },

    _onDateSelected:function(date){
        this._date = date;
        console.log(this._date);

        //if a user selected another date after source project combobox was selected, refresh data in testcases-string:
        if(this._source){
            this._onSourceSelected(this._source);
        }
        else{
            Ext.getCmp('sourceproject').enable();
        }

    },

    _onSourceSelected: function(record){
        var that = this;
        that._source = record;
        console.log('project', that._source);

        var isoDate =  Rally.util.DateTime.toIsoString(this._date,true);
        Ext.create('Rally.data.WsapiDataStore', {
            model: 'TestCase',
            fetch: ['ObjectID','FormattedID','LastUpdateDate','Project'],
            limit: Infinity,
            autoLoad: true,
            context:{
                project: that._source
            },
            filters: [
                {
                    property: 'LastUpdateDate',
                    operator: '>',
                    value: isoDate
                }
            ],
            listeners: {
                load: this.onDataLoaded,
                scope: this
            }
        });
    },

    onDataLoaded:function(store, data){
        this._data = data;
        console.log('store.getTotalCount( ) ',store.getTotalCount( ) );
        console.log('data',data);
        Ext.getCmp('destinationproject').enable();

        var value = "FOUND " + this._data.length +  " TEST CASES UPDATED BEFORE " +  this._date + '<br />';

        _.each(data, function(testcase){
            value += '<a href="https://rally1.rallydev.com/#/detail/testcase/' + testcase.get('ObjectID') + '" target="_blank">' + testcase.get('FormattedID') + '</a>' +
                ', Last Update Date: ' +  testcase.get('LastUpdateDate') + '<br />'
        });

        var tc = Ext.create('Ext.Component', {
            xtype: 'component',
            itemId: 'tc',
            id: 'testcases-string',
            html: value
        });

        this.add(tc);
    },

    _onDestinationSelected:function(record)    {
        this._destination = record;
        console.log('destination project', this._destination);
        Ext.getCmp('movebuttton').enable();
    },

    _move:function() {
        var that = this;
        Rally.data.BulkRecordUpdater.updateRecords({
            records: that._data,
            propertiesToUpdate: {
                Project: that._destination
            },
            success: function(readOnlyRecords){
            },
            scope: this
        });
    }


});