const svgWidth = 960;
const svgHeight = 500;

const margin = {
    top: 60,
    right: 60,
    bottom: 100,
    left: 100
};

const chartWidth = svgWidth - margin.left - margin.right;
const chartHeight = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.

var svg = d3.select("#scatter")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initital Params
var chosenXAxis = 'poverty';
var chosenYAxis = 'healthcare';

// function used for updating x-scale var upon click on axis label
function xScale(acsData, chosenXAxis) {
    // create scales
    var xLinearScale = d3.scaleLinear()
      .domain([d3.min(acsData, d => d[chosenXAxis]), // * 0.8,
        d3.max(acsData, d => d[chosenXAxis]), // * 1.2
      ])
      .range([0, chartWidth]);
  
    return xLinearScale;
  
}

// function used for updating y-scale var upon click on axis label
function yScale(acsData, chosenYAxis) {
    // create scales
    var yLinearScale = d3.scaleLinear()
        .domain([d3.min(acsData, d => d[chosenYAxis]),
            d3.max(acsData, d => d[chosenYAxis]),
        ])
        .range([chartHeight, 0]);
    
    return yLinearScale;
}

// function used for updating axes upon click
function renderAxes(newScale, axis, orientation) {
    if (orientation === 'v') {
        var newAxis = d3.axisLeft(newScale);
    }else {
        var newAxis = d3.axisBottom(newScale);
    }

    axis.transition()
        .duration(1000)
        .call(newAxis);

    return axis;
}

// function used for updating circles group witha transition
function renderCircles(circlesGroup, textGroup, newScale, chosenAxis, orientation){
    if (orientation === 'v') {
        circlesGroup.transition()
            .duration(1000)
            .attr("cy", d => newScale(d[chosenAxis]));
        textGroup.transition()
            .duration(1000)
            .attr("dy", d => newScale(d[chosenAxis]));
    }else {
        circlesGroup.transition()
            .duration(1000)
            .attr("cx", d => newScale(d[chosenAxis]));
        textGroup.transition()
            .duration(1000)
            .attr("dx", d => newScale(d[chosenAxis]));
    }
    return circlesGroup;
}



function updateToolTip(circlesGroup, circleLabels, xLabelsGroup, yLabelsGroup) {
    
    xValue = xLabelsGroup.select(".active").attr("value");
    yValue = yLabelsGroup.select(".active").attr("value");


    var toolTip = d3.tip()
        .attr("class", "d3-tip")
        .offset([80, -60])
        .html( d => 
            `<strong>${d.state}</strong>
            <hr>
            <strong>${xValue}</strong>: ${d[xValue]}<br>
            <strong>${yValue}</strong>: ${d[yValue]}
            `);
    
    circlesGroup.call(toolTip);

    circlesGroup.on("mouseover", function(d) { 
        toolTip.show(d, this)
        d3.select(this).attr("fill", "#e3cdc1")
    });
    circlesGroup.on("mouseout", function(d) { 
        toolTip.hide(d, this)
        d3.select(this).attr("fill", "#a0937d")
    });

    circleLabels.on("mouseover", function(d) { toolTip.show(d, this)});
    circleLabels.on("mouseout", function(d) { toolTip.hide(d, this)});

    return circlesGroup;
}

d3.csv('assets/data/data.csv').then(function(acsData, err) {
    if (err) throw err;

    acsData.forEach(function(data) {
        // x-axis
        data.poverty = +data.poverty;
        data.age = +data.age;
        data.income = +data.income;
        // y-axis
        data.healthcare = +data.healthcare;
        data.obesity = +data.obesity;
        data.smokes = +data.smokes;
    });

    // ------- AXES --------
    // Create x & y scale functions
    var xLinearScale = xScale(acsData, chosenXAxis);
    var yLinearScale = yScale(acsData, chosenYAxis);

    // Create initial axis functions
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    // Append x axis
    var xAxis = chartGroup.append("g")
        .classed("x-axis", true)
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(bottomAxis);

    // Append y axis
    var yAxis = chartGroup.append("g")
        .classed("y-axis", true)
        .call(leftAxis);
    
    
    // ------ CIRCLES --------
    // Append initital circles w/ text
    // Create main group for circles and a group cor each circle
    var circlesGroup = chartGroup.append("g")
        .classed("circle-group", true);


    // Add abbreviation labels first so theyre behind the circle layer
    // this allows for highlighting the slected circle
    var circleText = circlesGroup.selectAll("text")
        .data(acsData)
        .enter()
        .append("text")
        .attr("dx", d => xLinearScale(d[chosenXAxis]))
        .attr("dy", d => yLinearScale(d[chosenYAxis]))
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .text( d => d.abbr);

    var circles = circlesGroup.selectAll("circle")
        .data(acsData)
        .enter()
        .append("circle")
        .attr("cx", d => xLinearScale(d[chosenXAxis]))
        .attr("cy", d => yLinearScale(d[chosenYAxis]))
        .attr("r", 15)
        .attr("fill", "#a0937d")
        .attr("opacity", ".5");
        


    // ------- AXIS LABELS ---------
    // X-LABELS
    // Create group for three x-axis labels
    var xLabelsGroup = chartGroup.append("g")
        .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 20})`);
    
    var povertyLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 20)
        .attr("value", "poverty")
        .classed("active", true)
        .text("In Poverty (%)");
    
    var ageLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 40)
        .attr("value", "age")
        .classed("inactive", true)
        .text("Age (Median)");

    var incomeLabel = xLabelsGroup.append("text")
        .attr("x", 0)
        .attr("y", 60)
        .attr("value", "income")
        .classed("inactive", true)
        .text("Household Income (Median)");
    
    // Y-LABELS
    // Create group for three y-axis labels
    var yLabelsGroup = chartGroup.append("g")
        .attr("transform", "rotate(-90)")
        .attr("transform", `translate(0, ${chartHeight / 2})`); 
    
    var healthLabel = yLabelsGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0)
        .attr("y", -30)
        .attr("value", "healthcare")
        .classed("active", true)
        .text("Lacks Healthcare (%)");

    var smokesLabel = yLabelsGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0)
        .attr("y", -50)
        .attr("value", "smokes")
        .classed("inactive", true)
        .text("Smokes (%)");

    var obesityLabel = yLabelsGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0)
        .attr("y", -70)
        .attr("value", "obesity")
        .classed("inactive", true)
        .text("Obese (%)");

    circlesGroup = updateToolTip(circles, circleText, xLabelsGroup, yLabelsGroup);
    
    xLabelsGroup.selectAll("text")
        .on("click", function() {
            var value = d3.select(this).attr("value");
            if (value !== chosenXAxis) {
                chosenXAxis = value;

                // set all X labels inactive
                povertyLabel.attr("class", "inactive");
                ageLabel.attr("class", "inactive");
                incomeLabel.attr("class", "inactive");
                // set selected label as active
                d3.select(this).attr("class", "active");

                // set new X scale
                xLinearScale = xScale(acsData, chosenXAxis);

                // render new axis
                xAxis = renderAxes(xLinearScale, xAxis, "h");

                // render new circles
                circlesGroup = renderCircles(circles, circleText, xLinearScale, chosenXAxis, "h");

                circlesGroup = updateToolTip(circles, circleText, xLabelsGroup, yLabelsGroup);
            }
        })

    yLabelsGroup.selectAll("text")
        .on("click", function() {
            var value = d3.select(this).attr("value");
            if (value !== chosenYAxis) {
                chosenYAxis = value;

                // set all Y labels inactive
                healthLabel.attr("class", "inactive");
                smokesLabel.attr("class", "inactive");
                obesityLabel.attr("class", "inactive");
                // set selected y label as active
                d3.select(this).attr("class", "active");

                // set new Y scale
                yLinearScale = yScale(acsData, chosenYAxis);

                // render new axis
                yAxis = renderAxes(yLinearScale, yAxis, "v");

                // render new circles
                circlesGroup = renderCircles(circles, circleText, yLinearScale, chosenYAxis, "v");
                
                circlesGroup = updateToolTip(circles, circleText, xLabelsGroup, yLabelsGroup);
            }
        })



}).catch( err => console.log(err));