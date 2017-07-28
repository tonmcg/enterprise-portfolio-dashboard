"use strict";

// loader settings
var opts = {
    lines: 9, // The number of lines to draw
    length: 9, // The length of each line
    width: 5, // The line thickness
    radius: 14, // The radius of the inner circle
    color: '#c10e19', // #rgb or #rrggbb or array of colors
    speed: 1.9, // Rounds per second
    trail: 40, // Afterglow percentage
    className: 'spinner', // The CSS class to assign to the spinner
};

var target = document.getElementById("dashboard");

// trigger loader
var spinner = new Spinner(opts).spin(target);

// dimensions for the charts
var margins = {
    top: 25,
    right: 10,
    bottom: 20,
    left: 10
};

// var size = getSize();
// var height = size.height;
// var width = size.width;

var dashboardHeight = document.querySelector('div#dashboard.content').offsetHeight;
var navbarHeight = document.querySelector('nav.navbar').offsetHeight;
var backgroundColor = d3.scale.ordinal().domain(['Green', 'Low', 'Met', 'Yellow', 'Medium', 'Moderate', 'Not met', 'Red', 'High', 'All']).range(['#4dac26', '#4dac26', '#4dac26', '#ffffd9', '#ffffd9', '#ffffd9', '#ffffd9', '#d7191c', '#d7191c', '#2c7bb6']),
    color = d3.scale.ordinal().domain(['Green', 'Low', 'Met', 'Yellow', 'Medium', 'Moderate', 'Not met', 'Red', 'High', 'All']).range(['#fff', '#fff', '#fff', '#565656', '#565656', '#565656', '#565656', '#fff', '#fff', '#fff']);


// tick label and tooltip formats
var sFormat = d3.format("s"),
    dFormat = d3.format("d"),
    iFormat = d3.format(",.0f"),
    perFormat = d3.format(".1%"),
    currFormat = d3.format("$,.0f");

// local formatting to get billions
// https://github.com/d3/d3/issues/2241
var formatNumber = d3.format(".1f"),
    formatBillion = function(x) {
        return '$' + formatNumber(x / 1e9) + "B";
    },
    formatMillion = function(x) {
        return '$' + formatNumber(x / 1e6) + "M";
    },
    formatThousand = function(x) {
        return '$' + formatNumber(x / 1e3) + "k";
    };

// tooptip
var tooltip = d3.select("body")
    .append("div")
    .style({
        "position": "absolute",
        "z-index": "10",
        "visibility": "hidden"
    })
    .attr({
        "class": "tooltip"
    });

// dc.js charts
var select = dc.selectMenu('#components');

// http://www.howtocreate.co.uk/tutorials/javascript/browserwindow
function getSize() {
    var myWidth = 0,
        myHeight = 0;
    if (typeof(window.innerWidth) == 'number') {
        //Non-IE
        myWidth = window.innerWidth;
        myHeight = window.innerHeight;
    }
    else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
        //IE 6+ in 'standards compliant mode'
        myWidth = document.documentElement.clientWidth;
        myHeight = document.documentElement.clientHeight;
    }
    else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
        //IE 4 compatible
        myWidth = document.body.clientWidth;
        myHeight = document.body.clientHeight;
    }
    return {
        "height": myHeight,
        "width": myWidth
    };
}

function formatAbbreviation(x) {
    var v = Math.abs(x);
    return (v >= 0.9995e9 ? formatBillion :
        v >= 0.9995e6 ? formatMillion :
        formatThousand)(x);
}

function createViz(error, data) {

    if (error) throw error;

    // stop spin.js loader
    spinner.stop();

    var results = data.value.filter(function(d) {
        if (d.Year == 'CY') {
            d.Metric = (d.MetricsNotMet === 0) ? 'Met': 'Not met (' + d.MetricsNotMet + ')'; // zero equals Green, all else equals Red
        }
        d.sharedService = d.sharedService.toUpperCase();
        d.PIVEnabled = d.PIVEnabled.toUpperCase();
        d.TotalContracts = d.TotalContracts || 0;
        d.ModularContracts = d.ModularContracts || 0;
        d.EVMcontracts = d.EVMcontracts || 0;
        d.ProjectCostColor = d.ProjectCostColor || 'N/A';
        d.ProjectScheduleColor = d.ProjectScheduleColor || 'N/A';
        d.releaseEverySixMo = d.releaseEverySixMo == null ? 'N/A' : d.releaseEverySixMo.toUpperCase();
        d.Active_x0020_Projects = +d.Active_x0020_Projects || 0;
        d.projectLifeCycleCost = +d.projectLifeCycleCost * 1000000 || 0;
        d.DME = +d.DME * 1000000 || 0;
        d.SS = +d.SS * 1000000 || 0;
        d.Total = +d.Total * 1000000 || 0;
        return d.Year == 'CY';
    });

    // set crossfilter
    var ndx = crossfilter(results);

    // define dimensions
    var investmentDim = ndx.dimension(function(d) {
        return d.InvestmentTitle;
    }),
    idDim = ndx.dimension(function(d) {
        return d.Id;
    });

    // group dimensions
    var all = ndx.groupAll(),
    amountByInvestment = investmentDim.group().reduceSum(function(d) {
        return d.Total;
    });

    // menuselect
    select
        .dimension(investmentDim)
        .group(amountByInvestment)
        .filterDisplayed(function () {
            return true;
        })
        .multiple(false)
        .numberVisible(null)
        // .order(function (a,b) {
        //     return a.key > b.key ? 1 : b.key > a.key ? -1 : 0;
        // })
        .title(function(d) {
            return d.key;
        })
        .promptText('All Investments')
        .promptValue(null);

    select.on('pretransition', function(chart) {
        // add Bootstrap styling to select input
        d3.select('#components').classed('dc-chart', false);
        chart.select('select').classed('w3-form', true);
    });

    // http://stackoverflow.com/questions/21113513/reorder-datatable-by-column
    var datatable = $("#data-table").dataTable({
        "scrollY": "200px",
        "scrollCollapse": true,
        "paging": false,
        "responsive": true,
        "paginage": false,
        "bLengthChange": false,
        "filter": false,
        "sort": false,
        "info": false,
        "autoWidth": true,
        "deferRender": true,
        "data": idDim.top(Infinity),
        "bDestroy": true,
        "order": [
            [0, "asc"]
        ],
        "columnDefs": [{
            "title": "Investment",
            "targets": 0,
            "data": "InvestmentTitle",
            "defaultContent": "",
            "width": "40%",
            "visible": false
        },{
            "title": "Cost Color",
            "targets": 1,
            "data": "InvestmentCostColor",
            "createdCell": function (td, cellData, rowData, row, col) {
                var text = cellData.substring(0, 8).trim();
                if ( text === "Green" || text === "Yellow" || text === "Red" || text === "Met" || text === "Moderate" || text === "High" || text === "Low" || text === "Not met" ) {
                    return d3.select(td).style({
                        'background-color': backgroundColor(text),
                        'color': color(text)
                    });
                }
            },
            "width": "12.5%"
        }, {
            "title": "Schedule Color",
            "targets": 2,
            "data": "InvestmentScheduleColor",
            "createdCell": function (td, cellData, rowData, row, col) {
                var text = cellData.substring(0, 8).trim();
                if ( text === "Green" || text === "Yellow" || text === "Red" || text === "Met" || text === "Moderate" || text === "High" || text === "Low" || text === "Not met" ) {
                    return d3.select(td).style({
                        'background-color': backgroundColor(text),
                        'color': color(text)
                    });
                }
            },
            "width": "12.5%"
        }, {
            "title": "Performance Metrics",
            "targets": 3,
            "data": "Metric",
            "createdCell": function (td, cellData, rowData, row, col) {
                var text = cellData.substring(0, 8).trim();
                if ( text === "Green" || text === "Yellow" || text === "Red" || text === "Met" || text === "Moderate" || text === "High" || text === "Low" || text === "Not met" ) {
                    return d3.select(td).style({
                        'background-color': backgroundColor(text),
                        'color': color(text)
                    });
                }
            },
            "width": "12.5%"
        }, {
            "title": "Risk",
            "targets": 4,
            "data": "SummaryRisk",
            "createdCell": function (td, cellData, rowData, row, col) {
                var text = cellData.substring(0, 8).trim();
                if ( text === "Green" || text === "Yellow" || text === "Red" || text === "Met" || text === "Moderate" || text === "High" || text === "Low" || text === "Not met" ) {
                    return d3.select(td).style({
                        'background-color': backgroundColor(text),
                        'color': color(text)
                    });
                }
            },
            "width": "12.5%"
        }, {
            "title": "Component CIO Color",
            "targets": 5,
            "data": "ComponentCIOColor",
            "createdCell": function (td, cellData, rowData, row, col) {
                var text = cellData.substring(0, 8).trim();
                if ( text === "Green" || text === "Yellow" || text === "Red" || text === "Met" || text === "Moderate" || text === "High" || text === "Low" || text === "Not met" ) {
                    return d3.select(td).style({
                        'background-color': backgroundColor(text),
                        'color': color(text)
                    });
                }
            },
            "width": "12.5%"
        }, {
            "title": "DOJ CIO Color",
            "targets": 6,
            "data": "DOJCIOColor",
            "createdCell": function (td, cellData, rowData, row, col) {
                var text = cellData.substring(0, 8).trim();
                if ( text === "Green" || text === "Yellow" || text === "Red" || text === "Met" || text === "Moderate" || text === "High" || text === "Low" || text === "Not met" ) {
                    return d3.select(td).style({
                        'background-color': backgroundColor(text),
                        'color': color(text)
                    });
                }
            },
            "width": "12.5%"
        }],
        "headerCallback": function( thead, data, start, end, display ) {
            d3.select(thead).style({
                'background-color':'steelblue',
                'color': 'white'
            });
        }
    });

    var pmTable = $("#pm-table").dataTable({
        "scrollY": "200px",
        "scrollCollapse": true,
        "paging": false,
        "responsive": true,
        "paginage": false,
        "bLengthChange": false,
        "filter": false,
        "sort": false,
        "info": false,
        "autoWidth": true,
        "deferRender": true,
        "data": idDim.top(Infinity),
        "bDestroy": true,
        "order": [
            [0, "asc"]
        ],
        "columnDefs": [{
            "title": "Investment",
            "targets": 0,
            "data": "InvestmentTitle",
            "defaultContent": "",
            "width": "40%",
            "visible": false
        },{
            "title": "Name",
            "targets": 1,
            "data": "pmName",
            "defaultContent": "",
            "width": "33%"
        }, {
            "title": "Qualification",
            "targets": 2,
            "data": "pmQualifications",
            "defaultContent": "",
            "width": "67%"
        }],
        "headerCallback": function( thead, data, start, end, display ) {
            d3.select(thead).style({
                'background-color':'steelblue',
                'color': 'white'
            });
        }

    });

    var lifecycleTable = $("#lifecycle-table").dataTable({
        "scrollY": "200px",
        "scrollCollapse": true,
        "paging": false,
        "responsive": true,
        "paginage": false,
        "bLengthChange": false,
        "filter": false,
        "sort": false,
        "info": false,
        "autoWidth": true,
        "deferRender": true,
        "data": idDim.top(Infinity),
        "bDestroy": true,
        "order": [
            [0, "asc"]
        ],
        "columnDefs": [{
            "title": "Investment",
            "targets": 0,
            "data": "InvestmentTitle",
            "defaultContent": "",
            "width": "40%",
            "visible": false
        },{
            "title": "LifeCycle Costs",
            "targets": 1,
            "data": "projectLifeCycleCost",
            "render": function(data, type, d) {
                return d3.format("$,.0f")(d.projectLifeCycleCost);
            },
            "createdCell": function(td, cellData, rowData, row, col) {
                $(td).attr('align', 'right');
            },
            "width": "25%"
        },{
            "title": "DME",
            "targets": 2,
            "data": "DME",
            "render": function(data, type, d) {
                return d3.format("$,.0f")(d.DME);
            },
            "createdCell": function(td, cellData, rowData, row, col) {
                $(td).attr('align', 'right');
            },
            "width": "25%"
        },{
            "title": "SS",
            "targets": 3,
            "data": "SS",
            "render": function(data, type, d) {
                return d3.format("$,.0f")(d.SS);
            },
            "createdCell": function(td, cellData, rowData, row, col) {
                $(td).attr('align', 'right');
            },
            "width": "25%"
        },{
            "title": "Total",
            "targets": 4,
            "data": "Total",
            "render": function(data, type, d) {
                return d3.format("$,.0f")(d.Total);
            },
            "createdCell": function(td, cellData, rowData, row, col) {
                $(td).attr('align', 'right');
            },
            "width": "25%"
        }],
        "headerCallback": function( thead, data, start, end, display ) {
            d3.select(thead).style({
                'background-color':'steelblue',
                'color': 'white'
            });
        }

    });

    var servicesTable = $("#services-table").dataTable({
        "scrollY": "200px",
        "scrollCollapse": true,
        "paging": false,
        "responsive": true,
        "paginage": false,
        "bLengthChange": false,
        "filter": false,
        "sort": false,
        "info": false,
        "autoWidth": true,
        "deferRender": true,
        "data": idDim.top(Infinity),
        "bDestroy": true,
        "order": [
            [0, "asc"]
        ],
        "columnDefs": [{
            "title": "Investment",
            "targets": 0,
            "data": "InvestmentTitle",
            "defaultContent": "",
            "width": "40%",
            "visible": false
        },{
            "title": "Does the Investment Include a Shared Service?",
            "targets": 1,
            "data": "sharedService",
            "createdCell": function (td, cellData, rowData, row, col) {
                var text = cellData == 'YES' ? 'Green' : 'Red';
                return d3.select(td).style({
                    'color': backgroundColor(text)
                });
            },
            "width": "50%"
        },{
            "title": "Are All Systems in the Investment PIV-enabled?",
            "targets": 2,
            "data": "PIVEnabled",
            "createdCell": function (td, cellData, rowData, row, col) {
                var text = cellData == 'YES' ? 'Green' : 'Red';
                return d3.select(td).style({
                    'color': backgroundColor(text)
                });
            },
            "width": "50%"
        }],
        "headerCallback": function( thead, data, start, end, display ) {
            d3.select(thead).style({
                'background-color':'steelblue',
                'color': 'white'
            });
        }

    });

    var risksTable = $("#risks-table").dataTable({
        "scrollY": "200px",
        "scrollCollapse": true,
        "paging": false,
        "responsive": true,
        "paginage": false,
        "bLengthChange": false,
        "filter": false,
        "sort": false,
        "info": false,
        "autoWidth": true,
        "deferRender": true,
        "data": idDim.top(Infinity),
        "bDestroy": true,
        "order": [
            [0, "asc"]
        ],
        "columnDefs": [{
            "title": "Investment",
            "targets": 0,
            "data": "InvestmentTitle",
            "defaultContent": "",
            "width": "40%",
            "visible": false
        },{
            "title": "No of Risks Reported",
            "targets": 1,
            "data": "RiskCount",
            "defaultContent": "",
            "width": "100%"
        }],
        "headerCallback": function( thead, data, start, end, display ) {
            d3.select(thead).style({
                'background-color':'steelblue',
                'color': 'white'
            });
        }

    });

    var projectsTable = $("#projects-table").dataTable({
        "scrollY": "200px",
        "scrollCollapse": true,
        "paging": false,
        "responsive": true,
        "paginage": false,
        "bLengthChange": false,
        "filter": false,
        "sort": false,
        "info": false,
        "autoWidth": true,
        "deferRender": true,
        "data": idDim.top(Infinity),
        "bDestroy": true,
        "order": [
            [0, "asc"]
        ],
        "columnDefs": [{
            "title": "Investment",
            "targets": 0,
            "data": "InvestmentTitle",
            "defaultContent": "",
            "width": "40%",
            "visible": false
        },{
            "title": "Projects Active or Not Started in FY17",
            "targets": 1,
            "data": "ProjectName",
            "render": function(data, type, d) {
                return d.ProjectName == null ? 'N/A' : d.ProjectName;
            },
            "width": "12.5%"
        },{
            "title": "Start Date",
            "targets": 2,
            "data": "startDate",
            "render": function(data, type, d) {
                return d.startDate == null ? 'N/A' : moment(d.startDate).format('LL');
            },
            "width": "12.5%"
        },{
            "title": "End Date",
            "targets": 3,
            "data": "completionDate",
            "render": function(data, type, d) {
                return d.completionDate == null ? 'N/A' : moment(d.completionDate).format('LL');
            },
            "width": "12.5%"
        },{
            "title": "LifeCycle Costs",
            "targets": 4,
            "data": "projectLifeCycleCost",
            "render": function(data, type, d) {
                return d.projectLifeCycleCost === 0 ? 'N/A' : d3.format("$,.0f")(d.projectLifeCycleCost);
            },
            "createdCell": function(td, cellData, rowData, row, col) {
                $(td).attr('align', 'right');
            },
            "width": "12.5%"
        },{
            "title": "Development Methodology",
            "targets": 5,
            "data": "SDLCMethodology",
            "render": function(data, type, d) {
                return d.SDLCMethodology == null ? 'N/A' : d.SDLCMethodology;
            },
            "width": "12.5%"
        },{
            "title": "Cost Color",
            "targets": 6,
            "data": "ProjectCostColor",
            "createdCell": function (td, cellData, rowData, row, col) {
                var text = cellData.substring(0, 8).trim();
                if ( text === "Green" || text === "Yellow" || text === "Red" || text === "Met" || text === "Moderate" || text === "High" || text === "Low" || text === "Not met" ) {
                    return d3.select(td).style({
                        'background-color': backgroundColor(text),
                        'color': color(text)
                    });
                }
            },
            "width": "12.5%"
        }, {
            "title": "Schedule Color",
            "targets": 7,
            "data": "ProjectScheduleColor",
            "createdCell": function (td, cellData, rowData, row, col) {
                var text = cellData.substring(0, 8).trim();
                if ( text === "Green" || text === "Yellow" || text === "Red" || text === "Met" || text === "Moderate" || text === "High" || text === "Low" || text === "Not met" ) {
                    return d3.select(td).style({
                        'background-color': backgroundColor(text),
                        'color': color(text)
                    });
                }
            },
            "width": "12.5%"
        },{
            "title": "Production Release Every 6 Months?",
            "targets": 8,
            "data": "releaseEverySixMo",
            "render": function(data, type, d) {
                return d.releaseEverySixMo == null ? 'N/A' : d.releaseEverySixMo;
            },
            "width": "12.5%"
        }],
        "headerCallback": function( thead, data, start, end, display ) {
            d3.select(thead).style({
                'background-color':'steelblue',
                'color': 'white'
            });
        }

        //
    });

    var contractsTable = $("#contracts-table").dataTable({
        "scrollY": "200px",
        "scrollCollapse": true,
        "paging": false,
        "responsive": true,
        "paginage": false,
        "bLengthChange": false,
        "filter": false,
        "sort": false,
        "info": false,
        "autoWidth": true,
        "deferRender": true,
        "data": idDim.top(Infinity),
        "bDestroy": true,
        "order": [
            [0, "asc"]
        ],
        "columnDefs": [{
            "title": "Investment",
            "targets": 0,
            "data": "InvestmentTitle",
            "defaultContent": "",
            "width": "40%",
            "visible": false
        },{
            "title": "Total Contracts",
            "targets": 1,
            "data": "TotalContracts",
            "defaultContent": "",
            "width": "33%"
        },{
            "title": "Total Modular Contracts",
            "targets": 2,
            "data": "ModularContracts",
            "defaultContent": "",
            "width": "33%"
        },{
            "title": "Total EVM Contracts",
            "targets": 3,
            "data": "EVMcontracts",
            "defaultContent": "",
            "width": "34%"
        }],
        "headerCallback": function( thead, data, start, end, display ) {
            d3.select(thead).style({
                'background-color':'steelblue',
                'color': 'white'
            });
        }

        //
    });

    var operationsTable = $("#operations-table").dataTable({
        "scrollY": "200px",
        "scrollCollapse": true,
        "paging": false,
        "responsive": true,
        "paginage": false,
        "bLengthChange": false,
        "filter": false,
        "sort": false,
        "info": false,
        "autoWidth": true,
        "deferRender": true,
        "data": idDim.top(Infinity),
        "bDestroy": true,
        "order": [
            [0, "asc"]
        ],
        "columnDefs": [{
            "title": "Investment",
            "targets": 0,
            "data": "InvestmentTitle",
            "defaultContent": "",
            "width": "40%",
            "visible": false
        },{
            "title": "Last DIRC Review",
            "targets": 1,
            "data": "LastDIRCreview",
            "render": function(data, type, d) {
                return d.LastDIRCreview == null ? 'N/A' : moment(d.LastDIRCreview).format('LL');
            },
            "width": "25%"
        },{
            "title": "No. of Active Metrics",
            "targets": 2,
            "data": "ActiveMetrics",
            "defaultContent": "",
            "width": "25%"
        },{
            "title": "No. Reported as 'Not Met'",
            "targets": 3,
            "data": "MetricsNotMet",
            "createdCell": function (td, cellData, rowData, row, col) {
                var text = cellData > 0 ? 'red' : 'black';
                return d3.select(td).style({
                    'color': text
                });
            },
            "width": "25%"
        },{
            "title": "Notes",
            "targets": 4,
            "data": "Notes",
            "defaultContent": "",
            "width": "25%"
        }],
        "headerCallback": function( thead, data, start, end, display ) {
            d3.select(thead).style({
                'background-color':'steelblue',
                'color': 'white'
            });
        }

        //
    });

    // filter to 'BOP BOPNet'
    // select.filter('BOP BOPNet');
    select.filter('BOP BOPNet')
    refreshTable();
    dc.renderAll();

    // define mouseover and mouseout events
    function bindHover() {
    }

    bindHover();

    function refreshTable() {
        dc.events.trigger(function() {
            var initiativeData = idDim.top(Infinity);
            datatable.fnClearTable();
            pmTable.fnClearTable();
            lifecycleTable.fnClearTable();
            servicesTable.fnClearTable();
            risksTable.fnClearTable();
            projectsTable.fnClearTable();
            contractsTable.fnClearTable();
            operationsTable.fnClearTable();
            if (typeof initiativeData !== 'undefined' && initiativeData.length > 0) {
                datatable.fnAddData(initiativeData);
                pmTable.fnAddData(initiativeData);
                lifecycleTable.fnAddData(initiativeData);
                servicesTable.fnAddData(initiativeData);
                risksTable.fnAddData(initiativeData);
                projectsTable.fnAddData(initiativeData);
                contractsTable.fnAddData(initiativeData);
                operationsTable.fnAddData(initiativeData);
            }
        });
    }

    for (var i = 0; i < dc.chartRegistry.list().length; i++) {
        var chartI = dc.chartRegistry.list()[i];
        chartI.on("filtered", refreshTable);
    }

    // add selected item information as table in modal
    $('#data-table').on('click', 'tbody tr a', function(event) {
        var thisTable = d3.select($(this).closest('table')[0]);
        var thisRow = d3.select($(this).closest('tr')[0]);
        var cells = thisRow.selectAll('td')[0].map(function(d) {
            var text;
            if (d.firstChild !== undefined && d.firstChild.textContent !== undefined) {
                text = d.firstChild.textContent;
            }
            else {
                text = d.textContent;
            }
            return text;
        });
        var headers = thisTable.selectAll('thead th')[0].map(function(d) {
            return d.textContent;
        });
        var data = headers.map(function(d, i) {
            var obj = {};
            obj.key = d;
            obj.value = cells[i];
            return obj;
        });

        $('#tableDiv table').remove();
        var table = d3.select('#tableDiv').append('table').attr({
            'id': 'modal-table',
            'class': 'table table-bordered table-condensed'
        }).style({
            'width': '100%',
            'table-layout': 'fixed'
        });
        var tbody = table.append('tbody');

        var rows = tbody.selectAll('tr')
            .data(data);

        rows.enter()
            .append('tr');

        rows.exit().remove();

        rows.append('td').text(function(d) {
            return d.key;
        });
        rows.append('td').text(function(d) {
            return d.value;
        });
    });

}

function exportTable() {
    export_table_to_excel('data-table', 'Initiatives');
} // parameters: 0, id of html table, 1, name of workbook

// if this JavaScript source file resides on a SharePoint server
// the function will return an endpoint Url pointing to a specified SharePoint list
// if not, the endpoint will point to a json file
function getData() {

    var test = '';
    var siteUrl = '';
    var columns = '';
    var expand = '';
    var filter = '';
    var top = '';
    var instrg = 0;

        // test if on SharePoint
        try {
            instrg = _spPageContextInfo.webAbsoluteUrl.indexOf('itim');
            if (typeof _spPageContextInfo !== undefined &&  instrg > 0) {
                siteUrl = _spPageContextInfo.webAbsoluteUrl;
                test = false;
            } else {
                siteUrl = undefined;
                test = true;
            }
        }
        catch (e) {
            siteUrl = undefined;
            test = true;
        }

    function callData(siteUrl, type, title, columns, expand, filter, top) {

        var url = "",
            endpoint;

        if (!test) {
        	if (type !== 'web') {
            	url = siteUrl + "/_api/web/lists/GetByTitle('" + title + "')/items?$select=" + columns + "&$expand=" + expand + "&$filter=" + filter + "&$top=" + top;
        	} else {
        		url = siteUrl + "/_api/web/" + title;
        	}
            endpoint = d3.json(url).header("accept", "application/json;odata=nometadata");

        }
        else {
            url = instrg == 0 ? "../SiteAssets/data/" + title + ".json" : "../SiteAssets/data/" + title + ".js";
            endpoint = d3.json(url);
        }

        return endpoint;

    }

    columns = "Id,UII,InvestmentTitle,Year,DME,SS,Total,DOJCIOColor,ComponentCIOColor,pmName,pmQualifications,sharedService,PIVEnabled,SummaryRisk,ActiveMetrics,MetricsNotMet,RiskCount,Active_x0020_Projects,ProjectName,startDate,completionDate,projectLifeCycleCost,SDLCMethodology,ProjectScheduleColor,ProjectCostColor,releaseEverySixMo,projectStatus,InvestmentCostColor,InvestmentScheduleColor,TotalContracts,ModularContracts,EVMcontracts,LastDIRCreview";
    expand = "";
    filter = "";
    top = "";

    var componentEndpoint = callData(siteUrl, 'BusinessCaseSummaryV2', columns, expand, filter, top);

    // Get the data
    d3_queue.queue()
        .defer(componentEndpoint.get)
        .await(createViz);

}

getData();
