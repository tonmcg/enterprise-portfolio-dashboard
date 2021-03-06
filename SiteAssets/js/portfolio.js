// "use strict";

// create spinner
let target = d3.select("#dashboard").node();
// create tooltip
let tooltip = d3.select("body").append("div").style({"position": "absolute","z-index": "10","visibility": "hidden"}).attr({"class": "tooltip"});
// trigger loader
let spinner = new Spinner(opts).spin(target);

// dimensions for the charts
var dashboardHeight = getSize().height;
var headerHeight = document.querySelector('div.w3-main > header').offsetHeight;
var footerHeight = document.querySelector('div.w3-main > footer').offsetHeight;

var treeMapHeaderHeight = document.querySelector('#treeMap header').offsetHeight;
var treeMapFooterHeight = document.querySelector('#treeMap footer').offsetHeight;
var treeMapHeight = (dashboardHeight - headerHeight - footerHeight - treeMapHeaderHeight - treeMapFooterHeight) * 8/9;

// var treeMapWidth = document.querySelector('#treeMap footer').clientWidth; // does not include margin, padding, or scroll bar widths
var treeMapWidth = document.querySelector('#treeMap footer').offsetWidth - 16;

// patterned after Bill White's treemap
// http://www.billdwhite.com/wordpress/2012/12/16/d3-treemap-with-title-headers/

var chartWidth = treeMapWidth;
var chartHeight = treeMapHeight;
var xscale = d3.scale.linear().range([0, chartWidth]);
var yscale = d3.scale.linear().range([0, chartHeight]);
var color = d3.scale.category20();
var headerHeight = 40;
var headerColor = "#6E6E6E";
var transitionDuration = 750;
var root;
var node;
// var year = d3.select("#investment_year").property('value');
var year = 'cy';

var margins = {
    top: 25,
    right: 10,
    bottom: 20,
    left: 10
};

var treemap = d3.layout.treemap()
    .round(false)
    .size([chartWidth, chartHeight])
    .sticky(true)
    .sort(function(a, b) {
        return a.value - b.value;
    })
    .value(function(d) {
        return d['size_' + year];
    });

var chart = d3.select("#component")
    .append("svg:svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .append("svg:g");

function createViz(error, data) {

    if (error) throw error;

    // stop spin.js loader
    spinner.stop();

    var records = data.value.map(function(d) {
        d.Year = +d.Year;
        if (d.Year === 2017) {
            d.Total_CY = +d.Total * 1000;
        } else if (d.Year === 2018) {
            d.Total_BY = +d.Total * 1000;
        } else if (d.Year === 2016) {
            d.Total_PY = +d.Total * 1000;
        }
        return d;
    });
    
    var nest = d3.nest()
        .key(function(d) {
            return d.Component;
        })
        .key(function(d) {
            return d.InvestmentName;
        })
        .rollup(function(leaves) {
            return {
                "total_cy": d3.sum(leaves, function(d) {
                    return d.Total_CY;
                }),
                "total_by": d3.sum(leaves, function(d) {
                    return d.Total_BY;
                }),
                "total_py": d3.sum(leaves, function(d) {
                    return d.Total_PY;
                })
            };
        })
        .entries(records);

    var children = nest.map(function(d) {
        // var count = d.values.length;
        var investments = d.values.map(function(g) {
            return {
                name: g.key,
                // count: count,
                count_cy: g.values.total_cy === 0 ? 0 : 1,
                count_py: g.values.total_py === 0 ? 0 : 1,
                count_by: g.values.total_by === 0 ? 0 : 1,
                size_cy: g.values.total_cy,
                size_py: g.values.total_py,
                size_by: g.values.total_by
            };
        });
        return {
            name: d.key,
            children: investments
        };

    });

    var root = {
        name: "Department of Justice",
        children: children
    };

    node = root;
    var nodes = treemap.nodes(root);

    children = nodes.filter(function(d) {
        return !d.children;
    });
    var parents = nodes.filter(function(d) {
        return d.children;
    });

    // create parent cells
    var parentCells = chart.selectAll("g.cell.parent")
        .data(parents, function(d) {
            return "p-" + d.name;
        });

    // var parentEnterTransition = parentCells.enter()
    //     .append("g")
    //     .attr("class", "cell parent")
    var parentEnterTransition = parentCells.enter()
        .append("g")
        .attr("class", "cell parent")
        .on("click", function(d) {
            zoom(d);
        })
        .append("svg")
        .attr("class", "clip")
        .attr("width", function(d) {
            return Math.max(0.01, d.dx);
        })
        .attr("height", headerHeight)    
        .on("click", function(d) {
            zoom(d);
        });

    parentEnterTransition.append("rect")
        .attr("width", function(d) {
            return Math.max(0.01, d.dx);
        })
        .attr("height", headerHeight)
        .style("fill", headerColor);

    // use <text> tag instead of non-SVG compliant <foreignObject> tag, which also doesn't work in IE
    parentEnterTransition.append('text')
        .attr("class", "label")
        .attr("transform", "translate(3, 23)")
        .attr("width", function(d) {
            return Math.max(0.01, d.dx);
        })
        .attr("height", headerHeight)
        .style("fill","#fff")
        .text(function(d) {
            var text = d.depth > 0 ? " investments, " + formatAbbreviation(d.value) : " Components";
            var count = d.depth > 0 ? d3.sum(d.children,function(g) { return g['count_'+year] }) : d.children.length;
            return d.name + ": " + count + text;
        })
        ;    

    // update transition
    var parentUpdateTransition = parentCells.transition().duration(transitionDuration);
    parentUpdateTransition.select(".cell")
        .attr("transform", function(d) {
            return "translate(" + d.dx + "," + d.y + ")";
        });

    parentUpdateTransition.select("rect")
        .attr("width", function(d) {
            return Math.max(0.01, d.dx);
        })
        .attr("height", headerHeight)
        .style("fill", headerColor);

    // use <text> tag instead of non-SVG compliant <foreignObject> tag, which also doesn't work in IE
    parentUpdateTransition.select(".label")
        .attr("transform", "translate(3, 23)")
        .attr("width", function(d) {
            return Math.max(0.01, d.dx);
        })
        .attr("height", headerHeight)
        ;
    // remove transition
    parentCells.exit()
        .remove();

    // create children cells
    var childrenCells = chart.selectAll("g.cell.child")
        .data(children, function(d) {
            return "c-" + d.name;
        });
    // enter transition
    var childEnterTransition = childrenCells.enter()
        .append("g")
        .attr("class", "cell child")
        .on("click", function(d) {
            zoom(node === d.parent ? root : d.parent);
        });
    childEnterTransition.append("rect")
        .classed("background", true)
        .style("fill", function(d) {
            return color(d.parent.name);
        });

    // use <text> tag instead of non-SVG compliant <foreignObject> tag, which also doesn't work in IE
    childEnterTransition.append('text')
        .attr("class", "label")
        .attr('x', function(d) {
            return d.dx / 2;
        })
        .attr('y', function(d) {
            return d.dy / 2;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .style("display", "none")
        .text(function(d) {
            return d.name;
        })
        ;

    // use <text> tag instead of non-SVG compliant <foreignObject> tag, which also doesn't work in IE
    childEnterTransition.selectAll(".label")
        .style("display", "none")
    ;
    
    // update transition
    var childUpdateTransition = childrenCells.transition().duration(transitionDuration);
    childUpdateTransition.select(".cell")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    childUpdateTransition.select("rect")
        .attr("width", function(d) {
            return Math.max(0.01, d.dx);
        })
        .attr("height", function(d) {
            return d.dy;
        })
        .style("fill", function(d) {
            return color(d.parent.name);
        });

    // use <text> tag instead of non-SVG compliant <foreignObject> tag, which also doesn't work in IE
    childUpdateTransition.select(".label")
        .attr('x', function(d) {
            return d.dx / 2;
        })
        .attr('y', function(d) {
            return d.dy / 2;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .style("display", "none")
        .text(function(d) {
            return d.name;
        })
        ;
        
    // exit transition
    childrenCells.exit()
        .remove();

    // Change the date header to reflect the date and time of the data
    d3.select('#dateHeader').text(formatDate(new Date()));

    d3.select("#investment_year").on("change", function() {
        year = this.value;
        treemap.value(size)
            .nodes(root);
        zoom(node);
    });
    
    var treeChart = d3.select("#component")
    var width = +treeChart.select('svg').attr('width');
    var height = +treeChart.select('svg').attr('height');
    var calcString = +(height / width) * 100 + "%";

    var svgElement = treeChart.select('svg');
    var svgParent = d3.select(treeChart.select('svg').node().parentNode);
    
    svgElement.attr({
        'class':'scaling-svg',
        'preserveAspectRatio':'xMinYMin',
        'viewBox':'0 0 ' + width + ' ' + height,
        'width':null,
        'height':null
    });
    
    svgParent.style('padding-bottom',calcString);
    
    zoom(node);
    
    // define mouseover and mouseout events
    function bindHover() {
        document.body.addEventListener('mousemove',function( e ) {
            if ((e.target.nodeName == 'rect' && e.target.classList.contains('background'))) {
                var d = d3.select(e.target).data()[0];
                var key = d.name;
                var amount = formatAbbreviation(d['size_' + year]);
                showDetail(e, key, amount, null, null);
            }
        });
        
        document.body.addEventListener('mouseout',function( e ) {
            if ((e.target.nodeName == 'rect' && e.target.classList.contains('background'))) hideDetail();
        });
    }

    bindHover();

}

function size(d) {
    return d['size_' + year];
}

//and another one
function textHeight(d) {
    var ky = chartHeight / d.dy;
    yscale.domain([d.y, d.y + d.dy]);
    return (ky * d.dy) / headerHeight;
}

function getRGBComponents(color) {
    var r = color.substring(1, 3);
    var g = color.substring(3, 5);
    var b = color.substring(5, 7);
    return {
        R: parseInt(r, 16),
        G: parseInt(g, 16),
        B: parseInt(b, 16)
    };
}

function idealTextColor(bgColor) {
    var nThreshold = 105;
    var components = getRGBComponents(bgColor);
    var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);
    return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
}

function zoom(d) {
    this.treemap
        .padding([headerHeight / (chartHeight / d.dy), 0, 0, 0])
        .nodes(d);

    // moving the next two lines above treemap layout messes up padding of zoom result
    var kx = chartWidth / d.dx;
    var ky = chartHeight / d.dy;
    var level = d;

    xscale.domain([d.x, d.x + d.dx]);
    yscale.domain([d.y, d.y + d.dy]);

    if (node != level) {
        // use <text> tag instead of non-SVG compliant <foreignObject> tag, which also doesn't work in IE
        chart.selectAll(".cell.child .label")
            .style("display", "none")
        ;
    }

    var zoomTransition = chart.selectAll("g.cell").transition().duration(transitionDuration)
        .attr("transform", function(d) {
            return "translate(" + xscale(d.x) + "," + yscale(d.y) + ")";
        })
        .each("end", function(d, i) {
            if (!i && (level !== self.root)) {
                chart.selectAll(".cell.child")
                    .filter(function(d) {
                        return d.parent === self.node; // only get the children for selected group
                    })
                    // use <text> tag instead of non-SVG compliant <foreignObject> tag, which also doesn't work in IE
                    .select(".label")
                    .style("display", "")
                    .style("fill", function(d) {
                        return idealTextColor(color(d.parent.name));
                    })
                    
                    .text(function(d) {
                        return d.name;
                    })
                    .each(wordWrap)
                    ;
                chart.selectAll(".clip .label")
                    .text(function(d) {
                        var text = d.depth > 0 ? " investments, " + formatAbbreviation(d.value) : " Components";
                        var count = d.depth > 0 ? d3.sum(d.children,function(g) { return g['count_'+year] }) : d.children.length;
                        return d.name + ": " + count + text;
                    });
            }
        });

    // use <text> tag instead of non-SVG compliant <foreignObject> tag, which also doesn't work in IE
    zoomTransition.select(".clip")
        .attr("width", function(d) {
            return Math.max(0.01, (kx * d.dx));
        })
        .attr("height", function(d) {
            return d.children ? headerHeight : Math.max(0.01, (ky * d.dy));
        });

    zoomTransition.select(".label")
        .attr("width", function(d) {
            return Math.max(0.01, (kx * d.dx));
        })
        .attr("height", function(d) {
            return d.children ? headerHeight : Math.max(0.01, (ky * d.dy));
        });

    zoomTransition.select(".child .label")
        .attr("x", function(d) {
            return kx * d.dx / 2;
        })
        .attr("y", function(d) {
            return ky * d.dy / 2;
        });
    // update the width/height of the rects
    zoomTransition.select("rect")
        .attr("width", function(d) {
            return Math.max(0.01, kx * d.dx);
        })
        .attr("height", function(d) {
            return d.children ? headerHeight : Math.max(0.01, ky * d.dy);
        })
        .style("fill", function(d) {
            return d.children ? headerColor : color(d.parent.name);
        });

    node = d;

    d3.select('#total_spend')
        .text('')
        .text(formatAbbreviation(d3.select('.parent').datum().value));
        
    if (d3.event) {
        d3.event.stopPropagation();
    }
}

// adapted from http://bl.ocks.org/mundhradevang/1387786
function fontSize(d, i) {
    var size = d.dx / 5;
    var words = d.name.split(' ');
    var word = words[0];
    var width = d.dx;
    var height = d.dy;
    var length = 0;
    d3.select(this).style("font-size", size + "px").text(word);
    while (((this.getBBox().width >= width) || (this.getBBox().height >= height)) && (size > 12)) {
        size--;
        d3.select(this).style("font-size", size + "px");
        this.firstChild.data = word;
    }
}

// adapted from http://bl.ocks.org/mundhradevang/1387786
function wordWrap(d, i) {
    var words = d.name.split(' ');
    var line = new Array();
    var length = 0;
    var text = "";
    var strokeWidth = parseInt(d3.select(this.previousSibling).style('stroke-width')); // get stroke width to provide "padding" for text
    var width = +this.previousSibling.getAttribute('width') - (strokeWidth * 2); // get the width of the <rect> svg since the d.dx data property reflects a non-zoomed in dimension 
    var height = +this.previousSibling.getAttribute('height') - (strokeWidth * 2); // get the height of the <rect> svg since the d.dx data property reflects a non-zoomed in dimension 
    var word;
    do {
        word = words.shift();
        line.push(word);
        if (words.length)
            this.firstChild.data = line.join(' ') + " " + words[0];
        else
            this.firstChild.data = line.join(' ');
        length = this.getBBox().width;
        if (length < width && words.length) {
        }
        else {
            text = line.join(' ');
            this.firstChild.data = text;
            if (this.getBBox().width > width) {
                text = d3.select(this).select(function() {
                    return this.lastChild;
                }).text();
                text = text + "...";
                d3.select(this).select(function() {
                    return this.lastChild;
                }).text(text);
                d3.select(this).classed("wordwrapped", true);
                break;
            }
            else
            ;

            if (text != '') {
                d3.select(this).append("tspan") // <tspan> tag should inherit x, y, and dy, properties of the <text> tag
                    .text(text);
                    
            }
            else
            ;

            if (this.getBBox().height > height && words.length) {
                text = d3.select(this).select(function() {
                    return this.lastChild;
                }).text();
                text = text + "...";
                d3.select(this).select(function() {
                    return this.lastChild;
                }).text(text);
                d3.select(this).classed("wordwrapped", true);

                break;
            }
            else
            ;

            line = new Array();
        }
    } while (words.length);
    this.firstChild.data = '';
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

    columns = "Id,Component,InvestmentName,Year,Total";
    expand = "";
    filter = "(InvestmentName ne null) and (Year gt 2015) and (Total ne 0) and (BudgetCall eq 'Passback')";
    top = 3000;

    var componentEndpoint = callData(siteUrl, 'list','AnnualBudgetData', columns, expand, filter, top);

    // Get the data
    componentEndpoint.get(function(error, data) {
        createViz(error, data);
    });

}
getData();