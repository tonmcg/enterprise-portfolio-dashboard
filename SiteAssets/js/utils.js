"use strict"

// loader settings
const opts = {
    lines: 9, // The number of lines to draw
    length: 9, // The length of each line
    width: 5, // The line thickness
    radius: 14, // The radius of the inner circle
    color: '#c10e19', // #rgb or #rrggbb or array of colors
    speed: 1.9, // Rounds per second
    trail: 40, // Afterglow percentage
    className: 'spinner', // The CSS class to assign to the spinner
};

// Many browsers -- IE particularly -- will not auto-size inline SVG
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

//preclude the use of Moment.js
function formatDate(date) {
    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    //http://stackoverflow.com/questions/3552461/how-to-format-a-javascript-date
    //http://stackoverflow.com/questions/25275696/javascript-format-date-time
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return monthNames[monthIndex] + ' ' + day + ', ' + year + ' ' + strTime;
}

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

// Show tooltip on hover
function showDetail(event, key, amount, count, percent) {

    // show tooltip with information from the __data__ property of the element
    var x_hover = 0;
    var y_hover = 0;

    var content = "<b>" + key + "</b><br/>";

    if (amount != null) content += "<b>Amount: </b>" + amount + "<br/>";
    if (count != null) content += "<b>Count: </b>" + count + "<br/>";
    if (percent != null) content += "<b>Percent: </b>" + percent + "<br/>";

    var tooltipWidth = parseInt(tooltip.style('width'));
    var tooltipHeight = parseInt(tooltip.style('height'));
    var classed,notClassed;
    
    if (event.pageX > document.body.clientWidth / 2) {
        x_hover = tooltipWidth + 30;
        classed = 'right';
        notClassed = 'left';
    } else {
        x_hover = -30;
        classed = 'left';
        notClassed = 'right';
    }
    
    y_hover = (document.body.clientHeight - event.pageY < (tooltipHeight + 4)) ? event.pageY - (tooltipHeight + 4) : event.pageY - tooltipHeight / 2;

    return tooltip
        .classed(classed,true)
        .classed(notClassed,false)
        .style({
            "visibility": "visible",
            "top": y_hover + "px",
            "left": (event.pageX - x_hover) + "px"
        })
        .html(content);
}

// Hide tooltip on hover
function hideDetail() {

    // hide tooltip
    return tooltip.style("visibility", "hidden");
}

// open and close sidebar on browser resize
function w3_open() {
    document.getElementById('portSidebar').style.display = 'block';
}

function w3_close() {
    document.getElementById('portSidebar').style.display = 'none';
}

// function w3_open() {
//   document.getElementById("main").style.marginLeft = "200px";
//   document.getElementById("portSidebar").style.width = "200px";
//   document.getElementById("portSidebar").style.display = "block";
//   document.getElementById("openNav").style.display = 'none';
// }
// function w3_close() {
//   document.getElementById("main").style.marginLeft = "0%";
//   document.getElementById("portSidebar").style.display = "none";
//   document.getElementById("openNav").style.display = "inline-block";
// }

function exportTable(wbName) {
    export_table_to_excel('data-table', wbName); // parameters: 0, id of html table, 1, name of workbook
}