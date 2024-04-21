const svgHeight = 800;
const svgWidth = 800;
var cellSize;
const padding = 50;
const colorbarWidth = 300;
const colorbarHeight = 20;

d3.json("bandemicstats.json").then((data) => {
    console.log(data);
    // Create an array to store unique names
    var uniqueNames = {};

    // Iterate through each object in the JSON array to collect unique names
    data.forEach(row => {
        const names = Object.keys(row).filter(key => key !== "Month" && key !== "Played" && key !== "Attempt" && key !== "Win" && key !== "Funding");
        names.forEach(name => {
            uniqueNames[row[name]] = (uniqueNames[row[name]] || 0) + 1;
        });
    });

    uniqueNames = Object.entries(uniqueNames).sort((a, b) => b[1] - a[1]);
    // Extract the letters from the sorted array
    uniqueNames = uniqueNames.map(pair => pair[0]);
    console.log(uniqueNames)

    // Create an empty matrix to store co-occurrence counts and win rates
    const matrix = Array.from({ length: uniqueNames.length }, () => Array.from({ length: uniqueNames.length }, () => ({ coOccurrence: 0, winRate: 0 })));
    
    // Iterate through each object in the JSON array
    data.forEach(row => {
        // Iterate through each column in the row
        const names = Object.keys(row).filter(key => key !== "Month" && key !== "Played" && key !== "Attempt" && key !== "Win" && key !== "Funding");
        for (let i = 0; i < names.length; i++) {
            for (let j = i + 1; j < names.length; j++) {
                const name1Index = uniqueNames.indexOf(row[names[i]]);
                const name2Index = uniqueNames.indexOf(row[names[j]]);
                matrix[name1Index][name2Index].coOccurrence++;
                matrix[name2Index][name1Index].coOccurrence++;
                if (row.Win === "1") {
                    matrix[name1Index][name2Index].winRate++;
                    matrix[name2Index][name1Index].winRate++;
                }
            }
        }
    });
    
    // Calculate win rates for each pair
    matrix.forEach(row => {
        row.forEach(cell => {
            cell.winRate /= cell.coOccurrence || 1; // Avoid division by zero
        });
    });

    // Output the matrix
    console.log(matrix);

    var margin = {top: 150, right: 0, bottom: 0, left: 150};
    var w = svgWidth - margin.left - margin.right;
    var h = svgWidth - margin.top - margin.bottom;
    
    // add base svg object
    var svg = d3.select("body").append("svg")
        .attr("id", "chart")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom);
        
    // add container for Mike Bostock margin convention
    svg = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    cellSize = h/uniqueNames.length;
    
    // Create color scale
    const colorScale = d3.scaleLinear()
    .domain([0, 1]) // Domain from 0 to maximum co-occurrence count
    .range(["black", "orange"]); // Color scale

    // size scale based on number of cooccs
    const sizeScale = d3.scaleLinear()
    .domain([1, 13])
    .range([2,cellSize/2])
    .clamp(true);

    const bgSquares = svg.selectAll("rect")
    .data(matrix.flat())
    .enter()
    .append("rect")
    .attr("x", (d,i) => (i%uniqueNames.length)*cellSize)
    .attr("y", (d,i) => Math.floor(i/uniqueNames.length)*cellSize)
    .attr("width", cellSize)
    .attr("height", cellSize)
    .attr("stroke", "rgba(100,100,100,0.1)")
    .attr("transform", `translate(${-cellSize/2}, ${-cellSize/2})`)
    .attr("fill-opacity", 0);

    // Create groups for each row in the matrix
    const rows = svg.selectAll(".row")
    .data(matrix)
    .enter().append("g")
    .attr("class", "row")
    .attr("transform", (d, i) => `translate(0, ${i * cellSize})`);

    // Create groups for each cell in the matrix
    const cells = rows.selectAll(".cell")
    .data(d => d)
    .enter().append("circle")
    .attr("class", "cell")
    .attr("r", (d) => {
        return d.coOccurrence == 0 ? 0 : sizeScale(d.coOccurrence);
    })
    .attr("cx", (d, i) => i * cellSize)
    // .attr("transform", (d) => `translate(${-sizeScale(d)/2},${-sizeScale(d)/2})`)
    .attr("fill", (d) => colorScale(d.winRate));

    // Add tooltip
    cells.append("title")
    .text(d => d);

    // Optional: Add axes
    const xScale = d3.scaleBand()
    .domain(uniqueNames)
    .range([0, w]);

    const yScale = d3.scaleBand()
    .domain(uniqueNames)
    .range([0, h]);

    const xAxis = d3.axisTop(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
    .attr("transform", `translate(${-cellSize/2}, ${-cellSize/2})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "start")
    .attr("transform", "rotate(-45)")
    .attr("dx", ".8em")
    .attr("dy", ".15em");

    svg.append("g")
    .attr("transform", `translate(${-cellSize/2}, ${-cellSize/2})`)
    .call(yAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("transform", "rotate(-45)")
    .attr("dx", "0em")
    .attr("dy", "-1em");

    // add colorbar
    const colorbarSvg = d3.select("body").append("svg")
    .attr("width", colorbarWidth + 50)
    .attr("height", colorbarHeight + 100)
    .style("overflow", "visible");

    // Create colorbar
    const colorbarGradient = colorbarSvg.append("defs")
    .append("linearGradient")
    .attr("id", "colorbar-gradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

    colorbarGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", colorScale(0));

    colorbarGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", colorScale(1));

    colorbarSvg.append("rect")
    .attr("x", padding)
    .attr("y", padding)
    .attr("width", colorbarWidth)
    .attr("height", colorbarHeight)
    .style("fill", "url(#colorbar-gradient)");

    const cbScale = d3.scaleLinear()
    .domain([0,1])
    .range([0, colorbarWidth]);

    const cbAxis = d3.axisTop(cbScale).ticks(3).tickFormat(d3.format(".0%"));;

    colorbarSvg.append("g")
    .call(cbAxis)
    .attr("transform", `translate(${50}, ${50})`)

    colorbarSvg.append("text")
    .text("Pair Winrate")
    .attr("x", 200)
    .attr("y", 20)
    .attr("font-family", "sans-serif")
    .attr("text-anchor", "middle");

})

// Function to save SVG as SVG file
function saveSVG() {
    var svgString = new XMLSerializer().serializeToString(document.getElementById("chart"));
    var blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    saveAs(blob, "chart.svg");
}