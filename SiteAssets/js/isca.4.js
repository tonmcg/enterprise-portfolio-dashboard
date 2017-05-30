"use strict";

// create spinner
var target = d3.select("#dashboard").node();
// create tooltip
var tooltip = d3.select("body").append("div").style({
    "position": "absolute",
    "z-index": "10",
    "visibility": "hidden"
}).attr({
    "class": "tooltip"
});
// trigger loader
var spinner = new Spinner(opts).spin(target);

// dimensions for the charts
var dashboardHeight = getSize().height;
var headerHeight = document.querySelector('div.w3-main > header').offsetHeight;
var footerHeight = document.querySelector('div.w3-main > footer').offsetHeight;

var sankeyHeaderHeight = document.querySelector('#sankey header').offsetHeight;
var sankeyFooterHeight = document.querySelector('#sankey footer').offsetHeight;
var height = (dashboardHeight - headerHeight - footerHeight - sankeyHeaderHeight - sankeyFooterHeight) * 8 / 9;

var width = document.querySelector('#sankey footer').offsetWidth - 16;

var component = 'All';

var color = d3.scale.category20();
var year = 'cy';

var margins = {
    top: 25,
    right: 10,
    bottom: 20,
    left: 10
};

// append the svg canvas to the page
var svg = d3.select("#component").append("svg")
    .attr("width", width + margins.left + margins.right)
    .attr("height", height + margins.top + margins.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margins.left + "," + (+margins.top) + ")");

// Set the sankey diagram properties
var sankey = d3.sankey()
    .nodeWidth(36)
    .nodePadding(2)
    .size([width, height]);

var path = sankey.link();

// load the data
// d3.json("../SiteAssets/data/ISCA.json", function(error, data) {
d3.json("../SiteAssets/data/Sankey.json", function(error, graph) {

    if (error) throw error;

    // stop spin.js loader
    spinner.stop();

    // var nest = d3.nest()
    // .key(function(d) {
    //     return d['Business Area'];
    // })
    // .key(function(d) {
    //     return d.Category;
    // })
    // .rollup(function(leaves) {
    //     return {
    //         "length": leaves.length, 
    //         "sum": d3.sum(leaves, function(d) {
    //             return d.Value;
    //         }
    //     )}
    // })
    // .entries(data.value);

    // var graph = {
    //     "nodes": [],
    //     "links": []
    // };

    // var results = nest.map(function(d) {
    //     graph.nodes.push({
    //         "name": d.key
    //     });
    //     graph.nodes.push({
    //         "name": d.values.map(function(g) {
    //             return g.key;
    //         })
    //     });
    //     graph.links.push({
    //         "source": d['Business Area'],
    //         "target": d.Category,
    //         "value": +d.Value
    //     });
    //     return d;
    // });

    // var results = data.value.map(function(d) {
    //     graph.nodes.push({
    //         "name": d['Business Area']
    //     });
    //     graph.nodes.push({
    //         "name": d.Category
    //     });
    //     graph.links.push({
    //         "source": d['Business Area'],
    //         "target": d.Category,
    //         "value": +d.Value
    //     });
    //     return d;
    // });

    // // http://www.d3noob.org/2013/02/formatting-data-for-sankey-diagrams-in.html
    // // return only the distinct / unique nodes
    // graph.nodes = d3.keys(d3.nest()
    //     .key(function(d) {
    //         return d.name;
    //     })
    //     .map(graph.nodes));

    // // loop through each link replacing the text with its index from node
    // graph.links.forEach(function(d, i) {
    //     graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
    //     graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
    // });

    // //now loop through each nodes to make nodes an array of objects
    // // rather than an array of strings
    // graph.nodes.forEach(function(d, i) {
    //     graph.nodes[i] = {
    //         "name": d
    //     };
    // });

    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(32);

    // add in the links
    var link = svg.append("g").selectAll(".link")
        .data(graph.links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", path)
        .style("stroke-width", function(d) {
            return Math.max(1, d.dy);
        })
        // .style("stroke", function(d,i) { 
        //   return d.source.color = color(d.source.name.replace(/ .*/, ""));
        //   // return color[i];
        // })
        .sort(function(a, b) {
            return b.dy - a.dy;
        });

    // add the link titles
    link.append("title")
        .text(function(d) {
            return d.source.name + " → " +
                d.target.name + "\n" + formatAbbreviation(d.value);
        });

    // add in the nodes
    var node = svg.append("g").selectAll(".node")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .call(d3.behavior.drag()
            .origin(function(d) {
                return d;
            })
            .on("dragstart", function() {
                this.parentNode.appendChild(this);
            })
            .on("drag", dragmove))
        //http://bl.ocks.org/frischmilch/7667996
        .on("mouseover", fade(0.4))
        .on("mouseout", fade(1))
        ;

    // add the rectangles for the nodes
    node.append("rect")
        .attr("height", function(d) {
            return d.dy;
        })
        .attr("width", sankey.nodeWidth())
        .style("fill", function(d, i) {
            return d.color = color(d.name.replace(/ .*/, ""));
        })
        .style("stroke", function(d) {
            return d3.rgb(d.color).darker(2);
        })
        .append("title")
        .text(function(d) {
            return d.name + "\n" + formatAbbreviation(d.value);
        });

    // // add in the title for the nodes
    // node.append("text")
    //     .attr("x", -6)
    //     .attr("y", function(d) {
    //         return d.dy / 2;
    //     })
    //     .attr("dy", ".35em")
    //     .attr("text-anchor", "end")
    //     .attr("transform", null)
    //     .text(function(d) {
    //         return d.name;
    //     })
    //     .filter(function(d) {
    //         return d.x < width / 2;
    //     })
    //     .attr("x", 6 + sankey.nodeWidth())
    //     .attr("text-anchor", "start");

    setResponsiveSVG(d3);

    // the function for moving the nodes
    function dragmove(d) {
        d3.select(this).attr("transform",
            "translate(" + d.x + "," + (
                d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
            ) + ")");
        sankey.relayout();
        link.attr("d", path);
    }

    // Returns an event handler for fading a given chord group.
    // http://bl.ocks.org/mbostock/4062006
    function fade(opacity) {
        return function(g, i) {
            var elements = svg.selectAll(".node");
            elements = elements.filter(function(d) {
                return d.name != graph.nodes[i].name;
            });
            elements.transition()
                .style("opacity", opacity);

            svg.selectAll(".link")
                .filter(function(d) {
                    return d.source.name != graph.nodes[i].name && d.target.name != graph.nodes[i].name;
                })
                .transition()
                .style("opacity", opacity);
        };
    }
});
