const svgHeight = 800;
const svgWidth = 1400;
var cellWidth;
var cellHeight;
const curveWidth = 10;
const curveOpacity = 0;

const colors = {
    mike: "#9c9c9c",
    thew: "#ff70ea",
    sejin: "#291800",
    joao: "#3dc8ff"
}

var thewLine, mikeLine, sejinLine, joaoLine;


d3.json("bandemicstats.json").then((data) => {
    console.log(data);

    // get a list of unique names sorted by frequency
    var uniqueNames = {};
    // Iterate through each object in the JSON array to collect unique names
    data.forEach(row => {
        const names = Object.keys(row).filter(key => key !== "Month" && key !== "Played" && key !== "Attempt" && key !== "Win" && key !== "Funding");
        names.forEach(name => {
            uniqueNames[row[name]] = (uniqueNames[row[name]] || 0) + 1;
        });
    });
    uniqueNames = Object.entries(uniqueNames).sort((a, b) => b[1] - a[1]);
    uniqueNames = uniqueNames.map(pair => pair[0]);
    console.log(uniqueNames);

    var winrates = {};
    // compute total winrates per character
    uniqueNames.forEach((name) => {
        var games = data.filter(d => (d.Thew == name || d.Mike == name || d.Sejin == name || d.João == name));
        var winrate = games.filter(d => d.Win == 1).length / games.length;
        winrates[name] = winrate;
    });
    console.log(winrates);

    var playerWinrates = {"Thew" : {}, "Mike" : {}, "Sejin" : {}, "João" : {}};
    const players = ["Thew", "Mike", "Sejin", "João"];
    players.forEach((player) => {
        uniqueNames.forEach((character) => {
            var games = data.filter(d => d[player] == character);
            var winrate = games.filter(d => d.Win == 1).length / games.length;
            playerWinrates[player][character] = winrate;
        })
    });
    console.log(playerWinrates);

    var margin = {top: 150, right: 150, bottom: 150, left: 150};
    var w = svgWidth - margin.left - margin.right;
    var h = svgHeight - margin.top - margin.bottom;
    
    // add base svg object
    var svg = d3.select("body").append("svg")
        .attr("id", "chart")
        .attr("viewBox", `0 0 ${w + margin.left + margin.right} ${h + margin.top + margin.bottom}`)
        .attr("width", window.height*4/7)
        .attr("height", window.height);
        
    // add container for Mike Bostock margin convention
    svg = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    cellWidth = w/30;
    cellHeight = h/15;

    // Generate data for the grid
    const gridData = Array(228).fill(0);
    console.log(gridData)

    const months = svg.append("g").selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .text((d) => {
            return `${d.Month.substring(0,3)} ${d.Attempt}`;
        })
        .attr("x", (d, i) => i * (cellWidth) + cellWidth/2)
        .attr("y", -6-cellHeight)
        .attr("font-family", "sans-serif")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .attr("fill", "black")
        .attr("fill-opacity", 0.8)
        .attr("font-size", 12)
        .attr("dy", "0.35em")
        .attr("transform", (d,i) => `rotate(-45, ${i * (cellWidth) + cellWidth/2}, ${-6-cellHeight}), translate(0,-10)`);

    const winLossGrid = svg.append("g").selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * (cellWidth))
        .attr("y", -6-cellHeight)
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .attr("fill", (d) => {
            return d.Win == 1 ? "#9fff94" : "#ff6b6b";
        })
        .attr("fill-opacity", 0.5);
    const winLossText = svg.append("g").selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .text((d) => {
            return d.Win == 1 ? "W" : "L"
        })
        .attr("x", (d, i) => i * (cellWidth) + cellWidth/2)
        .attr("y", -6-cellHeight/2)
        .attr("font-family", "sans-serif")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("fill", (d) => {
            return d.Win == 1 ? "#385c33" : "#451c1c";
        })
        .attr("fill-opacity", 0.8)
        .attr("font-size", 20)
        .attr("dy", "0.35em");

    // // // add funding chart
    // const funding = data.map(d => d.Funding);
    // var line = d3.line().curve(d3.curveStep);
    // const fundingLineCoords = [];
    // funding.forEach((d,i) => {
    //     fundingLineCoords.push([i*cellWidth, d*10]);
    // });
    // const fundingPathData = line(fundingLineCoords);
    // svg.append("path")
    //     .attr("d", fundingPathData)
    //     .attr("fill", "none")
    //     .attr("stroke", "black")
    //     .attr("stroke-width", 2)
    //     .attr("pointer-events", "none")
    //     .attr("transform", `translate(${cellWidth/2},${-cellHeight*1.5})`);

    svg.append("rect")
        .attr("x", 0)
        .attr("y", -6)
        .attr("width", 19*cellWidth)
        .attr("height", 6)
        .attr("fill", "grey");

    // background grid
    const grid = svg.append("g").selectAll("rect")
        .data(gridData)
        .enter()
        .append("rect")
        .attr("x", (d, i) => (i % 19) * (cellWidth))
        .attr("y", (d, i) => Math.floor(i / 19) * (cellHeight))
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .attr("fill-opacity", 0)
        .attr("stroke", "rgba(0,0,0,0.1)");

    var charYScale = d3.scaleBand()
        .domain(uniqueNames)
        .range([0,cellHeight*12]);

    var charWinrates = svg.append("g").selectAll("text")
        .data(uniqueNames)
        .enter()
        .append("text")
        .text((d, i) => {
            if (i == 0) return `${(winrates[d]*100).toFixed(1)}% total WR`
            return `${(winrates[d]*100).toFixed(1)}%`;
        })
        .attr("x", 19.2*cellWidth)
        .attr("y", (d) => charYScale(d)+cellHeight/2)
        .attr("dy", "0.35em")
        .attr("font-family", "sans-serif")
        .attr("font-style", "italic")
        .attr("font-size", 10);

    console.log(charWinrates)

    svg.append("text")
        .attr("id", "winrateText")
        .text("Hover over a circle to view player-character winrates")
        .attr("x", 0)
        .attr("y", cellHeight*12.8)
        .attr("font-family", "sans-serif")
        .attr("text-anchor", "start")
        .attr("font-size", 20)
        .attr("pointer-events", "none")

    const thewChars = data.map(d => d.Thew);
    const mikeChars = data.map(d => d.Mike);
    const sejinChars = data.map(d => d.Sejin);
    const joaoChars = data.map(d => d.João);
    
    const thewCircles = svg.append("g").selectAll("circle")
        .data(thewChars)
        .enter().append("circle")
        .attr("cx", (d, i) => i*cellWidth)
        .attr("cy", (d) => {
            return charYScale(d);
        })
        .attr("r", cellHeight/3)
        .attr("fill", colors.thew)
        .attr("transform", `translate(${cellWidth/2},${cellHeight/2})`)
        .on("mouseover", function() {
            thewLine.transition(100).attr("stroke-opacity", 1);
            var winrate = playerWinrates["Thew"][d3.select(this).data()];
            svg.select("#winrateText")
                .text(`Thew x ${d3.select(this).data()} winrate: ${(winrate*100).toFixed(2)}%`)
        })
        .on("mouseout", () => {
            thewLine.transition(100).attr("stroke-opacity", curveOpacity)
            svg.select("#winrateText")
                .text("Hover over a circle to view player-character winrates")
        });

    const mikeCircles = svg.append("g").selectAll("circle")
        .data(mikeChars)
        .enter().append("circle")
        .attr("cx", (d, i) => i*cellWidth)
        .attr("cy", (d) => {
            return charYScale(d);
        })
        .attr("r", cellHeight/3)
        .attr("fill", colors.mike)
        .attr("transform", `translate(${cellWidth/2},${cellHeight/2})`)
        .on("mouseover", function() {
            mikeLine.transition(100).attr("stroke-opacity", 1);
            var winrate = playerWinrates["Mike"][d3.select(this).data()];
            svg.select("#winrateText")
                .text(`Mike x ${d3.select(this).data()} winrate: ${(winrate*100).toFixed(2)}%`)
        })
        .on("mouseout", () => {
            mikeLine.transition(100).attr("stroke-opacity", curveOpacity)
            svg.select("#winrateText")
                .text("Hover over a circle to view player-character winrates")
        });

    const sejinCircles = svg.append("g").selectAll("circle")
        .data(sejinChars)
        .enter().append("circle")
        .attr("cx", (d, i) => i*cellWidth)
        .attr("cy", (d) => {
            return charYScale(d);
        })
        .attr("r", cellHeight/3)
        .attr("fill", colors.sejin)
        .attr("transform", `translate(${cellWidth/2},${cellHeight/2})`)
        .on("mouseover", function() {
            sejinLine.transition(100).attr("stroke-opacity", 1);
            var winrate = playerWinrates["Sejin"][d3.select(this).data()];
            svg.select("#winrateText")
                .text(`Sejin x ${d3.select(this).data()} winrate: ${(winrate*100).toFixed(2)}%`)
        })
        .on("mouseout", () => {
            sejinLine.transition(100).attr("stroke-opacity", curveOpacity)
            svg.select("#winrateText")
                .text("Hover over a circle to view player-character winrates")
        });

    const joaoCircles = svg.append("g").selectAll("circle")
        .data(joaoChars)
        .enter().append("circle")
        .attr("cx", (d, i) => i*cellWidth)
        .attr("cy", (d) => {
            return charYScale(d);
        })
        .attr("r", cellHeight/3)
        .attr("fill", colors.joao)
        .attr("transform", `translate(${cellWidth/2},${cellHeight/2})`)
        .on("mouseover", function() {
            joaoLine.transition(100).attr("stroke-opacity", 1);
            var winrate = playerWinrates["João"][d3.select(this).data()];
            svg.select("#winrateText")
                .text(`João x ${d3.select(this).data()} winrate: ${(winrate*100).toFixed(2)}%`)
        })
        .on("mouseout", () => {
            joaoLine.transition(100).attr("stroke-opacity", curveOpacity)
            svg.select("#winrateText")
                .text("Hover over a circle to view player-character winrates")
        });

    // draw lines between dots
    var line = d3.line().curve(d3.curveBumpX);

    const thewCenters = [];
    thewCircles.each(function() {
        const circle = d3.select(this);
        const cx = parseFloat(circle.attr("cx"));
        const cy = parseFloat(circle.attr("cy"));
        thewCenters.push([cx, cy]);
    });
    var pathData = line(thewCenters);
    thewLine = svg.append("path")
        .attr("d", pathData)
        .attr("fill", "none")
        .attr("stroke", colors.thew)
        .attr("stroke-width", curveWidth)
        .attr("stroke-opacity", curveOpacity)
        .attr("pointer-events", "none")
        .attr("transform", `translate(${cellWidth/2},${cellHeight/2})`);

    const mikeCenters = [];
    mikeCircles.each(function() {
        const circle = d3.select(this);
        const cx = parseFloat(circle.attr("cx"));
        const cy = parseFloat(circle.attr("cy"));
        mikeCenters.push([cx, cy]);
    });
    pathData = line(mikeCenters);
    mikeLine = svg.append("path")
        .attr("d", pathData)
        .attr("fill", "none")
        .attr("stroke", colors.mike)
        .attr("stroke-width", curveWidth)
        .attr("stroke-opacity", curveOpacity)
        .attr("pointer-events", "none")
        .attr("transform", `translate(${cellWidth/2},${cellHeight/2})`);

    const sejinCenters = [];
    sejinCircles.each(function() {
        const circle = d3.select(this);
        const cx = parseFloat(circle.attr("cx"));
        const cy = parseFloat(circle.attr("cy"));
        sejinCenters.push([cx, cy]);
    });
    pathData = line(sejinCenters);
    sejinLine = svg.append("path")
        .attr("d", pathData)
        .attr("fill", "none")
        .attr("stroke", colors.sejin)
        .attr("stroke-width", curveWidth)
        .attr("stroke-opacity", curveOpacity)
        .attr("pointer-events", "none")
        .attr("transform", `translate(${cellWidth/2},${cellHeight/2})`);

    const joaoCenters = [];
    joaoCircles.each(function() {
        const circle = d3.select(this);
        const cx = parseFloat(circle.attr("cx"));
        const cy = parseFloat(circle.attr("cy"));
        joaoCenters.push([cx, cy]);
    });
    pathData = line(joaoCenters);
    joaoLine = svg.append("path")
        .attr("d", pathData)
        .attr("fill", "none")
        .attr("stroke", colors.joao)
        .attr("stroke-width", curveWidth)
        .attr("stroke-opacity", curveOpacity)
        .attr("pointer-events", "none")
        .attr("transform", `translate(${cellWidth/2},${cellHeight/2})`);

    thewCircles.raise();
    mikeCircles.raise();
    sejinCircles.raise();
    joaoCircles.raise();

    svg.append("circle")
        .attr("cx", cellWidth*15)
        .attr("cy", cellHeight*12.8)
        .attr("r", cellHeight/3)
        .attr("fill", colors.thew)
        .on("mouseover", function() {
            thewLine.transition(100).attr("stroke-opacity", 1);
        })
        .on("mouseout", () => {
            thewLine.transition(100).attr("stroke-opacity", curveOpacity)
        });
    svg.append("text")
        .text("Thew")
        .attr("x", cellWidth*15.5)
        .attr("y", cellHeight*12.8)
        .attr("dy", "0.35em")
        .attr("font-family", "sans-serif")

    svg.append("circle")
        .attr("cx", cellWidth*15)
        .attr("cy", cellHeight*13.8)
        .attr("r", cellHeight/3)
        .attr("fill", colors.mike)
        .on("mouseover", function() {
            mikeLine.transition(100).attr("stroke-opacity", 1);
        })
        .on("mouseout", () => {
            mikeLine.transition(100).attr("stroke-opacity", curveOpacity)
        });
    svg.append("text")
        .text("Mike")
        .attr("x", cellWidth*15.5)
        .attr("y", cellHeight*13.8)
        .attr("dy", "0.35em")
        .attr("font-family", "sans-serif")

    svg.append("circle")
        .attr("cx", cellWidth*15)
        .attr("cy", cellHeight*14.8)
        .attr("r", cellHeight/3)
        .attr("fill", colors.sejin)
        .on("mouseover", function() {
            sejinLine.transition(100).attr("stroke-opacity", 1);
        })
        .on("mouseout", () => {
            sejinLine.transition(100).attr("stroke-opacity", curveOpacity)
        });
    svg.append("text")
        .text("Sejin")
        .attr("x", cellWidth*15.5)
        .attr("y", cellHeight*14.8)
        .attr("dy", "0.35em")
        .attr("font-family", "sans-serif")

    svg.append("circle")
        .attr("cx", cellWidth*15)
        .attr("cy", cellHeight*15.8)
        .attr("r", cellHeight/3)
        .attr("fill", colors.joao)
        .on("mouseover", function() {
            joaoLine.transition(100).attr("stroke-opacity", 1);
        })
        .on("mouseout", () => {
            joaoLine.transition(100).attr("stroke-opacity", curveOpacity)
        });
    svg.append("text")
        .text("Joao")
        .attr("x", cellWidth*15.5)
        .attr("y", cellHeight*15.8)
        .attr("dy", "0.35em")
        .attr("font-family", "sans-serif")
    

    // // old rect table code
    // svg.append("g").selectAll("rect")
    //     .data(joaoChars)
    //     .enter().append("rect")
    //     .attr("x", (d, i) => i*cellWidth)
    //     .attr("y", (d) => {
    //         return charYScale(d);
    //     })
    //     .attr("width", cellWidth)
    //     .attr("height", cellHeight)
    //     .attr("fill", colors.joao);

    var charAxis = d3.axisLeft(charYScale);
    var leftAxisCont = svg.append("g")
        .call(charAxis)
    leftAxisCont.selectAll("path").attr("opacity", 0);
    leftAxisCont.selectAll("text")
        .attr("font-size", 14)
})

// Function to save SVG as SVG file
function saveSVG() {
    var svgString = new XMLSerializer().serializeToString(document.getElementById("chart"));
    var blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    saveAs(blob, "chart.svg");
}