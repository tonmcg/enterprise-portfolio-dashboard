"use strict";

// create spinner
let target = d3.select("#dashboard").node();
// create tooltip
let tooltip = d3.select("body").append("div").style({"position": "absolute","z-index": "10","visibility": "hidden"}).attr({"class": "tooltip"});
// trigger loader
let spinner = new Spinner(opts).spin(target);

function createViz(error, data) {

    if (error) throw error;

    // stop spin.js loader
    spinner.stop();

    const dashboardHeight = getSize().height;
    const headerHeight = document.querySelector('div.w3-main > header').offsetHeight;
    const footerHeight = document.querySelector('div.w3-main > footer').offsetHeight;
    
    const barChartHeaderHeight = document.querySelector('#barChart1 header').offsetHeight;
    const barChartFooterHeight = document.querySelector('#barChart1 footer').offsetHeight;
    
    const barChart1Height = (dashboardHeight - headerHeight - footerHeight - barChartHeaderHeight - barChartFooterHeight) * 1/3;

    const barChartWidth = document.querySelector('#barChart1 footer').clientWidth; // does not include margin, padding, or scroll bar widths

    const margins = {
        top: 25,
        right: 10,
        bottom: 20,
        left: 10
    };
    
    const legendOffset = barChartWidth - (barChartWidth * 1/15);

    let years = [];
    let results = data.value.map(function(d) {
        d.Year = +d.Year;
        d.Value = +d.Value * 1000;
        if (years.indexOf(+d.Year) > -1) {
            years.push(+d.Year);
        }
        return d;
    });

    // set crossfilter
    let ndx = crossfilter(results);

    // define dimensions
    var
        componentDim = ndx.dimension(function(d) {
            return d.Component;
        }),
        categoryDim = ndx.dimension(function(d) {
            return d.Category;
        }),
        areaDim = ndx.dimension(function(d) {
            return d['Business Area'];
        });
        
    // group dimensions
    var all = ndx.groupAll(),
        amountByComponent = componentDim.group().reduceSum(function(d) {
            return d.Value;
        }),
        solutionsBy2016 = categoryDim.group().reduceSum(function(d) {
            if (d.Year === 2016 && (d.Category == "Mission Solutions" || d.Category == "Business Solutions")) {
                return d.Value;    
            } else {
                return null;
            }
        }),
        solutionsBy2017 = categoryDim.group().reduceSum(function(d) {
            if (d.Year === 2017 && (d.Category == "Mission Solutions" || d.Category == "Business Solutions")) {
                return d.Value;    
            } else {
                return null;
            }
        }),
        solutionsBy2018 = categoryDim.group().reduceSum(function(d) {
            if (d.Year === 2018 && (d.Category == "Mission Solutions" || d.Category == "Business Solutions")) {
                return d.Value;    
            } else {
                return null;
            }
        }),
        infrastructureBy2016 = categoryDim.group().reduceSum(function(d) {
            if (d.Year === 2016 && (d.Category == "Network Service Apportionment" || d.Category == "Computing & Facilities  Service Apportionment" || d.Category == "End-User Service Apportionment")) {
                return d.Value;    
            } else {
                return null;
            }
        }),
        infrastructureBy2017 = categoryDim.group().reduceSum(function(d) {
            if (d.Year === 2017 && (d.Category == "Network Service Apportionment" || d.Category == "Computing & Facilities  Service Apportionment" || d.Category == "End-User Service Apportionment")) {
                return d.Value;    
            } else {
                return null;
            }
        }),
        infrastructureBy2018 = categoryDim.group().reduceSum(function(d) {
            if (d.Year === 2018 && (d.Category == "Network Service Apportionment" || d.Category == "Computing & Facilities  Service Apportionment" || d.Category == "End-User Service Apportionment")) {
                return d.Value;    
            } else {
                return null;
            }
        }),
        areaBy2016 = areaDim.group().reduceSum(function(d) {
            if (d.Year === 2016) {
                return d.Value;    
            } else {
                return null;
            }
        }),
        areaBy2017 = areaDim.group().reduceSum(function(d) {
            if (d.Year === 2017) {
                return d.Value;    
            } else {
                return null;
            }
        }),
        areaBy2018 = areaDim.group().reduceSum(function(d) {
            if (d.Year === 2018) {
                return d.Value;    
            } else {
                return null;
            }
        }),
        totalAmount = ndx.groupAll().reduceSum(function(d) {
            return Math.round(d.Value);
        });
        
    // dc.js charts
    let componentSelect = dc.selectMenu('#components');
    let grouped1Chart = dc.barChart("#chart-area");
    let grouped2Chart = dc.barChart("#chart-infrastructure");
    let grouped3Chart = dc.barChart("#chart-solutions");
    // let dataTable = dc.dataTable('#data-table');

    // menuselect
    componentSelect
        .dimension(componentDim)
        .group(amountByComponent)
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
        .promptText('All Components')
        .promptValue(null);
        
    componentSelect.on('pretransition', function(chart) {
        // add Bootstrap styling to select input
        d3.select('#components').classed('dc-chart', false);
        chart.select('select').classed('w3-form', true);
    });

    // displays
    dc.numberDisplay("#total-initiatives")
        .formatNumber(dFormat)
        .valueAccessor(function(d) {
            return d;
        })
        .group(totalAmount)
        .formatNumber(function(d) {
            return formatAbbreviation(Math.abs(d));
        });

    dc.dataCount('#data-count')
        .dimension(ndx)
        .group(all);

    // charts
    grouped1Chart
        .width(barChartWidth)
        .height(barChart1Height)
        .groupBars(true)
        .groupGap(20)
        .centerBar(true)
        .dimension(areaDim)
        .group(areaBy2016, "2016")
        .valueAccessor(function(d) {
            return d.value;
        })
        .stack(areaBy2017, "2017", function(d) {
            return d.value;
        })
        .stack(areaBy2018, "2018", function(d) {
            return d.value;
        })
        .ordinalColors(colorbrewer.Set1[3])
        .x(d3.scale.ordinal().domain(years))
        .elasticX(false)
        .xUnits(dc.units.ordinal)
        // .barPadding(0.15)
        // .legend(dc.legend().x(width * 3.25).y(height / 6).itemHeight(18).gap(6))
        .legend(dc.legend().x(barChartWidth - legendOffset).horizontal(true))
        .margins({
            top: margins.top,
            right: margins.right,
            bottom: margins.bottom,
            left: margins.left + 50
        })
        .renderLabel(false)
        .renderTitle(false)
        .renderHorizontalGridLines(true)
        .elasticY(true)
        .yAxisLabel("Total Value")
        .yAxis().ticks(Math.max(barChart1Height / 50, 2)).tickFormat(function(d) {
            return formatAbbreviation(d);
        });

    grouped1Chart.on('pretransition',function(chart) {
        setResponsiveSVG(chart);
    });
    
    grouped2Chart
        .width(barChartWidth)
        .height(barChart1Height * 9/5)
        .groupBars(true)
        .groupGap(20)
        .centerBar(true)
        .dimension(categoryDim)
        .group(infrastructureBy2016, "2016")
        .keyAccessor(function(d) {
            return d.key;
        })
        .valueAccessor(function(d) {
            return d.value;
        })
        .stack(infrastructureBy2017, "2017", function(d) {
            return d.value;
        })
        .stack(infrastructureBy2018, "2018", function(d) {
            return d.value;
        })
        .ordinalColors(colorbrewer.Set1[3])
        .x(d3.scale.ordinal().domain(years))
        .elasticX(false)
        .xUnits(dc.units.ordinal)
        // .barPadding(0.15)
        // .legend(dc.legend().x(width * 3.25).y(height / 6).itemHeight(18).gap(6))
        .legend(dc.legend().x(barChartWidth - legendOffset).horizontal(true))
        .margins({
            top: margins.top,
            right: margins.right,
            bottom: margins.bottom,
            left: margins.left + 50
        })
        .renderLabel(false)
        .renderTitle(false)
        .renderHorizontalGridLines(true)
        .elasticY(true)
        .yAxisLabel("Total Value")
        .yAxis().ticks(Math.max(barChart1Height / 50, 2)).tickFormat(function(d) {
            return formatAbbreviation(d);
        });

    grouped2Chart.on('pretransition',function(chart) {
        setResponsiveSVG(chart);
    });

    grouped3Chart
        .width(barChartWidth)
        .height(barChart1Height * 9/5)
        .groupBars(true)
        .groupGap(20)
        .centerBar(true)
        .dimension(categoryDim)
        .group(solutionsBy2016, "2016")
        .valueAccessor(function(d) {
            return d.value;
        })
        .stack(solutionsBy2017, "2017", function(d) {
            return d.value;
        })
        .stack(solutionsBy2018, "2018", function(d) {
            return d.value;
        })
        .ordinalColors(colorbrewer.Set1[3])
        .x(d3.scale.ordinal().domain(years))
        .elasticX(false)
        .xUnits(dc.units.ordinal)
        // .barPadding(0.15)
        // .legend(dc.legend().x(width * 3.25).y(height / 6).itemHeight(18).gap(6))
        .legend(dc.legend().x(barChartWidth - legendOffset).horizontal(true))
        .margins({
            top: margins.top,
            right: margins.right,
            bottom: margins.bottom,
            left: margins.left + 50
        })
        .renderLabel(false)
        .renderTitle(false)
        .renderHorizontalGridLines(true)
        .elasticY(true)
        .yAxisLabel("Total Value")
        .yAxis().ticks(Math.max(barChart1Height / 50, 2)).tickFormat(function(d) {
            return formatAbbreviation(d);
        });

    grouped3Chart.on('pretransition',function(chart) {
        setResponsiveSVG(chart);
    });

    dc.renderAll();

    // define mouseover and mouseout events
    function bindHover() {
        d3.selectAll('g.stack .bar').on("mouseover", function(d) {
            let key = d.data.key;
            let amount = currFormat(d.data.value);
            showDetail( key, amount, null, null )
        }).on("mouseout", hideDetail);
    }

    bindHover();

    // Change the date header to reflect the date and time of the data
    d3.select('#dateHeader').text(formatDate(new Date()));

    // Many browsers -- IEparticularly -- will not auto-size inline SVG
    // IE applies default width and height sizing
    // padding-bottom hack on a container solves IE inconsistencies in size
    // https://css-tricks.com/scale-svg/#article-header-id-10
    function setResponsiveSVG(chart) {
        let width = +chart.select('svg').attr('width');
        let height = +chart.select('svg').attr('height');
        let calcString = +(height / width) * 100 + "%";

        let svgElement = chart.select('svg');
        let svgParent = d3.select(chart.select('svg').node().parentNode);
        
        svgElement.attr({
            'class':'scaling-svg',
            'preserveAspectRatio':'xMinYMin',
            'viewBox':'0 0 ' + width + ' ' + height,
            'width':null,
            'height':null
        });
        
        svgParent.style('padding-bottom',calcString);
    }

}

// if this JavaScript source file resides on a SharePoint server
// the function will return an endpoint Url pointing to a specified SharePoint list
// if not, the endpoint will point to a json file
function getData() {

    let test = '';
    let siteUrl = '';
    let cols = [];
    let expand = '';
    let filter = '';
    let top = '';

    // test if on SharePoint
    try {
        if (typeof _spPageContextInfo !== undefined) {
            siteUrl = _spPageContextInfo.webAbsoluteUrl;
            test = false;
        }
    }
    catch (e) {
        siteUrl = undefined;
        test = true;
    }

    function callData(siteUrl, type, title, columns, expand, filter, top) {

        let url = "",
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
            url = "../SiteAssets/data/" + title + ".json";
            endpoint = d3.json(url);
        }

        return endpoint;

    }

    cols = "Id,StrategyID,Title,Component_x0020_Name,Details_x0020_of_x0020_Strategy,Primary_x0020_Point_x0020_of_x00,Details_x0020_of_x0020_Strategy,Date_x0020_of_x0020_Agency_x0020,OMB_x0020_Initiatives,Commodity_x0020_IT_x0020_Categor,AmountType,Related_x0020_Investment_x0020_U,Use_x0020_of_x0020_Savings_x002f0,ProjectedAvoidance2014,ProjectedAvoidance2015,ProjectedAvoidance2016,ProjectedAvoidance2017,ProjectedAvoidance2018,ProjectedAvoidance2019,ProjectedSavings2014,ProjectedSavings2015,ProjectedSavings2016,ProjectedSavings2017,ProjectedSavings2018,ProjectedSavings2019,RealizedAvoidance2012,RealizedAvoidance2013,RealizedAvoidance2014,RealizedAvoidance2015,RealizedAvoidance2016,RealizedAvoidanceQ12017,RealizedAvoidance2018,RealizedSavings2012,RealizedSavings2013,RealizedSavings2014,RealizedSavings2015,RealizedSavings2016,RealizedSavingsQ12017,RealizedSavings2018,ImplementationCosts2012,ImplementationCosts2013,ImplementationCosts2014,ImplementationCosts2015,ImplementationCosts2016,ImplementationCosts2017,ImplementationCosts2018,ImplementationCosts2019,NetOrGross2012,NetOrGross2013,NetOrGross2014,NetOrGross2015,NetOrGross2016,NetOrGross2017,NetOrGross2018,NetOrGross2019,Author/Title";
    //for (let i = 0;i<columns.length;i++) {
    //    cols.push(columns[i].field);
    //}
    expand = "Author";
    filter = "";
    top = 200;

    let componentEndpoint = callData(siteUrl,'list','ISCA',cols,expand,filter,top);

    // Get the data
    componentEndpoint.get(function(error, data) {
        createViz(error, data);
    });

}

getData();