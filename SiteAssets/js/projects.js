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

var dashboardHeight = getSize().height;
var headerHeight = document.querySelector('div.w3-main > header').offsetHeight;
var footerHeight = document.querySelector('div.w3-main > footer').offsetHeight;

var pieChartHeaderHeight = document.querySelector('#pieChart1 header').offsetHeight;
var pieChartFooterHeight = document.querySelector('#pieChart1 footer').offsetHeight;
var pieChartHeight = (dashboardHeight - headerHeight - footerHeight - pieChartHeaderHeight - pieChartFooterHeight) * 1 / 4;

var tableHeaderHeight = document.querySelector('#tableChart header').offsetHeight;
var tableFooterHeight = document.querySelector('#tableChart footer').offsetHeight;
var tableHeight = (dashboardHeight - headerHeight - footerHeight - tableHeaderHeight - tableFooterHeight) * 1 / 2 * 0.9;

var pieChartWidth = document.querySelector('#pieChart1 footer').clientWidth; // does not include margin, padding, or scroll bar widths

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

// dc.js chart types
var selectOrg = dc.selectMenu('#components');
var selectMonth = dc.selectMenu('#months');
var pieChart1 = dc.pieChart('#scheduleChart');
var pieChart2 = dc.pieChart('#staffingChart');
var pieChart3 = dc.pieChart('#risksChart');
var pieChart4 = dc.pieChart('#issuesChart');
var pieChart5 = dc.pieChart('#costChart');
var pieChart6 = dc.pieChart('#customerChart');
var dataTable = dc.dataTable('#data-table');

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

var hideContent = false; // boolean value to determine whether to hide certain elements
var fiscalYear = 2017; // default fiscal year
var columns = [{
    label: 'Staff Organization',
    format: function(d) {
        return d.StaffOrg;
    }
}, {
    label: 'Project',
    format: function(d) {
        return d.Project0;
    }
}, {
    label: 'Project Manager',
    format: function(d) {
        return d.ProjectManager;
    }
}, {
    label: 'Remaining Obligated Funds',
    format: function(d) {
        var text = '';
        if (!hideContent) {
            text = formatAbbreviation(d.PlannedObligation - d.SpentObligation);
        }
        else {
            text = 'N/A';
        }
        return text;
    }
}, {
    label: 'Schedule Status',
    format: function(d) {
        return d.ScheduleColor;
    }
}, {
    label: 'Cost Status',
    format: function(d) {
        return d.CostColor;
    }
}, {
    label: 'Issue Status',
    format: function(d) {
        return d.IssuesColor;
    }
}, {
    label: 'Risk Status',
    format: function(d) {
        return d.RisksColor;
    }
}, {
    label: 'Staffing Status',
    format: function(d) {
        return d.StaffingColor;
    }
}, {
    label: 'Customer Satisfaction Status',
    format: function(d) {
        return d.CustomerColor;
    }
}];

var color = d3.scale.ordinal().domain(['Green', 'Yellow', 'Red', 'N/A']).range(['#4dac26', '#ffffd9', '#d7191c', '#f7f7f7']),
    fill = d3.scale.ordinal().domain(['Green', 'Yellow', 'Red', 'N/A']).range(['#fff', '#565656', '#fff', '#f7f7f7']);


function createViz(error, dataSet) {

    if (error) throw error;

    // stop spin.js loader
    spinner.stop();

    var data = dataSet.value.filter(function(d) {
        if (d.ScheduleStatus != null && d.ScheduleStatus != 'N/A') {
            d.ScheduleScore = +d.ScheduleStatus.substring(1, 2);
        }
        else {
            d.ScheduleScore = 0;
        }
        if (d.CostStatus != null && d.CostStatus != 'N/A') {
            d.CostScore = +d.CostStatus.substring(1, 2);
        }
        else {
            d.CostScore = 0;
        }
        if (d.IssuesStatus != null && d.IssuesStatus != 'N/A') {
            d.IssueScore = +d.IssuesStatus.substring(1, 2);
        }
        else {
            d.IssueScore = 0;
        }
        if (d.RisksStatus != null && d.RisksStatus != 'N/A') {
            d.RisksScore = +d.RisksStatus.substring(1, 2);
        }
        else {
            d.RisksScore = 0;
        }
        if (d.CustomerSatisfactionStatus != null && d.CustomerSatisfactionStatus != 'N/A') {
            d.CustomerScore = +d.CustomerSatisfactionStatus.substring(1, 2);
        }
        else {
            d.CustomerScore = 0;
        }
        if (d.StaffingStatus != null && d.StaffingStatus != 'N/A') {
            d.StaffingScore = +d.StaffingStatus.substring(1, 2);
        }
        else {
            d.StaffingScore = 0;
        }
        switch (d.ScheduleScore) {
            case 0:
                d.ScheduleColor = 'N/A';
                break;
            case 1:
                d.ScheduleColor = 'Red';
                break;
            case 2:
                d.ScheduleColor = 'Yellow';
                break;
            case 3:
                d.ScheduleColor = 'Green';
                break;
        }
        switch (d.CostScore) {
            case 0:
                d.CostColor = 'N/A';
                break;
            case 1:
                d.CostColor = 'Red';
                break;
            case 2:
                d.CostColor = 'Yellow';
                break;
            case 3:
                d.CostColor = 'Green';
                break;
        }
        switch (d.IssueScore) {
            case 0:
                d.IssuesColor = 'N/A';
                break;
            case 1:
                d.IssuesColor = 'Red';
                break;
            case 2:
                d.IssuesColor = 'Yellow';
                break;
            case 3:
                d.IssuesColor = 'Green';
                break;
        }
        switch (d.RisksScore) {
            case 0:
                d.RisksColor = 'N/A';
                break;
            case 1:
                d.RisksColor = 'Red';
                break;
            case 2:
                d.RisksColor = 'Yellow';
                break;
            case 3:
                d.RisksColor = 'Green';
                break;
        }
        switch (d.CustomerScore) {
            case 0:
                d.CustomerColor = 'N/A';
                break;
            case 1:
                d.CustomerColor = 'Red';
                break;
            case 2:
                d.CustomerColor = 'Yellow';
                break;
            case 3:
                d.CustomerColor = 'Green';
                break;
        }
        switch (d.StaffingScore) {
            case 0:
                d.StaffingColor = 'N/A';
                break;
            case 1:
                d.StaffingColor = 'Red';
                break;
            case 2:
                d.StaffingColor = 'Yellow';
                break;
            case 3:
                d.StaffingColor = 'Green';
                break;
        }
        d.ReportDate = moment(d.ReportMonth + ' 1, ' + fiscalYear, 'MMMM D YYYY')
        return d.ReportMonth != null && +d.FiscalYear === fiscalYear;
    });

    // set crossfilter
    var ndx = crossfilter(data);

    // define dimensions
    var
        orgDim = ndx.dimension(function(d) {
            return d.StaffOrg;
        }),
        monthDim = ndx.dimension(function(d) {
            return d.ReportMonth;
        }),
        staffingDim = ndx.dimension(function(d) {
            return d.StaffingColor;
        }),
        scheduleDim = ndx.dimension(function(d) {
            return d.ScheduleColor;
        }),
        costDim = ndx.dimension(function(d) {
            return d.CostColor;
        }),
        satisfactionDim = ndx.dimension(function(d) {
            return d.CustomerColor;
        }),
        issuesDim = ndx.dimension(function(d) {
            return d.IssuesColor;
        }),
        risksDim = ndx.dimension(function(d) {
            return d.RisksColor;
        }),
        projectDim = ndx.dimension(function(d) {
            return d.ProjectName;
        });

    // group dimensions
    var
        all = ndx.groupAll(),
        orgGroup = orgDim.group(),
        monthGroup = monthDim.group(),
        scheduleGroup = scheduleDim.group(),
        staffingGroup = staffingDim.group(),
        costGroup = costDim.group(),
        satisfactionGroup = satisfactionDim.group(),
        issuesGroup = issuesDim.group(),
        risksGroup = risksDim.group();

    var months = monthGroup.top(Infinity).map(function(d) {
        return d.key;
    });

    var monthsFilter = months[months.length - 1];
    console.log(monthsFilter);

    // menuselect
    selectOrg
        .dimension(orgDim)
        .group(orgGroup)
        // .filterDisplayed(function () {
        //     return true;
        // })
        .multiple(false)
        .numberVisible(null)
        // .order(function (a,b) {
        //     return a.key > b.key ? 1 : b.key > a.key ? -1 : 0;
        // })
        .title(function(d) {
            return d.key;
        })
        .promptText('All Staffs')
        .promptValue(null);

    selectOrg.on('pretransition', function(chart) {
        // add Bootstrap styling to select input
        d3.select('#components').classed('dc-chart', false);
        chart.select('select').classed('w3-form', true);
    });

    selectMonth
        .dimension(monthDim)
        .group(monthGroup)
        // .filterDisplayed(function () {
        //     return true;
        // })
        .multiple(false)
        .numberVisible(null)
        // .order(function (a,b) {
        //     return a.key > b.key ? 1 : b.key > a.key ? -1 : 0;
        // })
        .title(function(d) {
            return d.key;
        })
        .promptText('All Months')
        .promptValue(null);

    selectMonth.filter(monthsFilter);

    selectMonth.on('pretransition', function(chart) {
        // add Bootstrap styling to select input
        d3.select('#months').classed('dc-chart', false);
        chart.select('select').classed('w3-form', true);
    });

    // displays
    // dc.numberDisplay("#total-spend")
    //     .formatNumber(dFormat)
    //     .valueAccessor(function(d) {
    //         return d;
    //     })
    //     .group(totalAmount)
    //     .formatNumber(function(d) {
    //         return formatAbbreviation(Math.abs(d));
    //     });

    dc.dataCount('#data-count')
        .dimension(ndx)
        .group(all);

    // charts
    pieChart1
        .width(pieChartWidth)
        .height(pieChartHeight)
        .radius(pieChartWidth / 2)
        .dimension(scheduleDim)
        .group(scheduleGroup)
        .colors(function(d) {
            return color(d);
        }).renderLabel(true)
        .renderTitle(false)
        .externalRadiusPadding(pieChartWidth / 15)
        .innerRadius(pieChartWidth / 5);

    dc.override(pieChart1, 'legendables', function() {
        var items = pieChart1._legendables();
        return items.reverse();
    }); // reverse order of legend items

    pieChart1.on('pretransition', function(chart) {
        chart.selectAll('text.pie-label').style('fill', function(d) {
            return fill(d.data.key);
        });
        // make path stroke and rect borders bigger and darker
        var rects = chart.selectAll('g.dc-legend-item rect');
        rects.style('stroke-width', '1px');
        rects.style('stroke', '#ddd');
        var paths = chart.selectAll('g.pie-slice path');
        paths.style('stroke-width', '2px');
        paths.style('stroke', '#ddd');
        setResponsiveSVG(chart);
    });

    pieChart2
        .width(pieChartWidth)
        .height(pieChartHeight)
        .radius(pieChartWidth / 2)
        .dimension(staffingDim)
        .group(staffingGroup)
        .colors(function(d) {
            return color(d);
        }).renderLabel(true)
        .renderTitle(false)
        .externalRadiusPadding(pieChartWidth / 15)
        .innerRadius(pieChartWidth / 5);

    dc.override(pieChart2, 'legendables', function() {
        var items = pieChart2._legendables();
        return items.reverse();
    }); // reverse order of legend items

    pieChart2.on('pretransition', function(chart) {
        chart.selectAll('text.pie-label').style('fill', function(d) {
            return fill(d.data.key);
        });
        // make path stroke and rect borders bigger and darker
        var rects = chart.selectAll('g.dc-legend-item rect');
        rects.style('stroke-width', '1px');
        rects.style('stroke', '#ddd');
        var paths = chart.selectAll('g.pie-slice path');
        paths.style('stroke-width', '2px');
        paths.style('stroke', '#ddd');
        setResponsiveSVG(chart);
    });

    pieChart3
        .width(pieChartWidth)
        .height(pieChartHeight)
        .radius(pieChartWidth / 2)
        .dimension(risksDim)
        .group(risksGroup)
        .colors(function(d) {
            return color(d);
        }).renderLabel(true)
        .renderTitle(false)
        .externalRadiusPadding(pieChartWidth / 15)
        .innerRadius(pieChartWidth / 5);

    dc.override(pieChart3, 'legendables', function() {
        var items = pieChart3._legendables();
        return items.reverse();
    }); // reverse order of legend items

    pieChart3.on('pretransition', function(chart) {
        chart.selectAll('text.pie-label').style('fill', function(d) {
            return fill(d.data.key);
        });
        // make path stroke and rect borders bigger and darker
        var rects = chart.selectAll('g.dc-legend-item rect');
        rects.style('stroke-width', '1px');
        rects.style('stroke', '#ddd');
        var paths = chart.selectAll('g.pie-slice path');
        paths.style('stroke-width', '2px');
        paths.style('stroke', '#ddd');
        setResponsiveSVG(chart);
    });

    pieChart4
        .width(pieChartWidth)
        .height(pieChartHeight)
        .radius(pieChartWidth / 2)
        .dimension(issuesDim)
        .group(issuesGroup)
        .colors(function(d) {
            return color(d);
        }).renderLabel(true)
        .renderTitle(false)
        .externalRadiusPadding(pieChartWidth / 15)
        .innerRadius(pieChartWidth / 5);

    dc.override(pieChart4, 'legendables', function() {
        var items = pieChart4._legendables();
        return items.reverse();
    }); // reverse order of legend items

    pieChart4.on('pretransition', function(chart) {
        chart.selectAll('text.pie-label').style('fill', function(d) {
            return fill(d.data.key);
        });
        // make path stroke and rect borders bigger and darker
        var rects = chart.selectAll('g.dc-legend-item rect');
        rects.style('stroke-width', '1px');
        rects.style('stroke', '#ddd');
        var paths = chart.selectAll('g.pie-slice path');
        paths.style('stroke-width', '2px');
        paths.style('stroke', '#ddd');
        setResponsiveSVG(chart);
    });

    pieChart5
        .width(pieChartWidth)
        .height(pieChartHeight)
        .radius(pieChartWidth / 2)
        .dimension(costDim)
        .group(costGroup)
        .colors(function(d) {
            return color(d);
        }).renderLabel(true)
        .renderTitle(false)
        .externalRadiusPadding(pieChartWidth / 15)
        .innerRadius(pieChartWidth / 5);

    dc.override(pieChart5, 'legendables', function() {
        var items = pieChart5._legendables();
        return items.reverse();
    }); // reverse order of legend items

    pieChart5.on('pretransition', function(chart) {
        chart.selectAll('text.pie-label').style('fill', function(d) {
            return fill(d.data.key);
        });
        // make path stroke and rect borders bigger and darker
        var rects = chart.selectAll('g.dc-legend-item rect');
        rects.style('stroke-width', '1px');
        rects.style('stroke', '#ddd');
        var paths = chart.selectAll('g.pie-slice path');
        paths.style('stroke-width', '2px');
        paths.style('stroke', '#ddd');
        setResponsiveSVG(chart);
    });

    pieChart6
        .width(pieChartWidth)
        .height(pieChartHeight)
        .radius(pieChartWidth / 2)
        .dimension(satisfactionDim)
        .group(satisfactionGroup)
        .colors(function(d) {
            return color(d);
        }).renderLabel(true)
        .renderTitle(false)
        .externalRadiusPadding(pieChartWidth / 15)
        .innerRadius(pieChartWidth / 5);

    dc.override(pieChart6, 'legendables', function() {
        var items = pieChart6._legendables();
        return items.reverse();
    }); // reverse order of legend items

    pieChart6.on('pretransition', function(chart) {
        chart.selectAll('text.pie-label').style('fill', function(d) {
            return fill(d.data.key);
        });
        // make path stroke and rect borders bigger and darker
        var rects = chart.selectAll('g.dc-legend-item rect');
        rects.style('stroke-width', '1px');
        rects.style('stroke', '#ddd');
        var paths = chart.selectAll('g.pie-slice path');
        paths.style('stroke-width', '2px');
        paths.style('stroke', '#ddd');
        setResponsiveSVG(chart);
    });

    dataTable
        .dimension(projectDim).group(function(d) {
            return d;
        })
        .columns(columns)
        .size(projectDim.top(Infinity).length)
        .on('renderlet', function(table) {
            table.select('tr.dc-table-group').remove(); // remove unneccesary row dc.js adds beneath the header
            table.selectAll('td.dc-table-column._3').style('text-align','right');
            if (!hideContent) {
                var projectArray = [];
                var selectedMonth = selectMonth.filter();
                var cells = d3.selectAll('table tbody tr td.dc-table-column._1');
                cells.each(function() {
                    projectArray.push(this.textContent);
                    this.textContent = '';
                });
                // cells.text('');
                cells.data(projectArray).append('a').attr('href', function(d) {
                    return 'https://itim.doj.gov/itdashboard/_layouts/15/FormServer.html?XmlLocation=/itdashboard/StatusReport/' + fiscalYear + selectedMonth + '-' + d + '.xml&ClientInstalled=true&DefaultItemOpen=1&Source=https://itim.doj.gov/itdashboard/StatusReport/Forms/AllItems.html';
                }).text(function(d) {
                    return d;
                });
            }
            
            d3.select('table').selectAll('td').filter(function() {
                return this.textContent === 'Green';
            }).style({
                'background-color': color('Green'),
                'color': fill('Green'),
                'text-align': 'center'
            });
            d3.select('table').selectAll('td').filter(function() {
                return this.textContent === 'Yellow';
            }).style({
                'background-color': color('Yellow'),
                'color': fill('Yellow'),
                'text-align': 'center'
            });
            d3.select('table').selectAll('td').filter(function() {
                return this.textContent === 'Red';
            }).style({
                'background-color': color('Red'),
                'color': fill('Red'),
                'text-align': 'center'
            });
            d3.select('table').selectAll('td').filter(function() {
                return this.textContent === 'N/A';
            }).style({
                'background-color': '#f7f7f7',
                'text-align': 'center'
            });
        });

    dc.renderAll();

    // define mouseover and mouseout events
    function bindHover() {
        d3.selectAll('g.pie-slice').on("mouseover", function(d) {
            var key = d.data.key;
            var count = d.data.value;
            showDetail(key, null, count, null)
        }).on("mouseout", hideDetail);
    }

    bindHover();

    // Change the date header to reflect the date and time of the data
    d3.select('#dateHeader').text(moment().format('LLL'));

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

    // Many browsers -- IEparticularly -- will not auto-size inline SVG
    // IE applies default width and height sizing
    // padding-bottom hack on a container solves IE inconsistencies in size
    // https://css-tricks.com/scale-svg/#article-header-id-10
    function setResponsiveSVG(chart) {
        var width = +chart.select('svg').attr('width');
        var height = +chart.select('svg').attr('height');
        var calcString = +(height / width) * 100 + "%";

        var svgElement = chart.select('svg');
        var svgParent = d3.select(chart.select('svg').node().parentNode);

        svgElement.attr({
            'class': 'scaling-svg',
            'preserveAspectRatio': 'xMinYMin',
            'viewBox': '0 0 ' + width + ' ' + height,
            'width': null,
            'height': null
        });

        svgParent.style('padding-bottom', calcString);
    }

}

function exportTable() {
    export_table_to_excel('data-table', 'Projects'); // parameters: 0, id of html table, 1, name of workbook
}

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

    columns = "Id,FiscalYear,ReportMonth,Project0,ScheduleStatus,CostStatus,IssuesStatus,StaffingStatus,CustomerSatisfactionStatus,RisksStatus,StaffOrg,Milestone,MilestoneRevisedDeliveryDate,MilestoneActualDeliveryDate,MilstoneNotes,MilestoneComplete,Id,PlannedObligation,SpentObligation,ProjectManager";
    expand = "";
    filter = "";
    top = 1500;

    var componentEndpoint = callData('https://itim.doj.gov/itdashboard', 'list','IT Transformation Dashboard Status Report', columns, expand, filter, top);

    // Get the data
    d3_queue.queue()
        .defer(componentEndpoint.get)
        .await(createViz);

}

$(document).ready(function() {
    getData();
});