// Global variable to store dataset (reccomended from Scott Murray's book)
var dataset;

// Converts the data from a .csv to an array object with the correc types
var row_converter = function(d) {
    rounding_scale = 1000;
    return {
        Player: d.name, 
        Teams: d.teams, 
        Minutes: parseFloat(d.minutes), 
        FIFA: parseFloat(d.fifa), 
        APM: Math.round(parseFloat(d.APM) * rounding_scale) / rounding_scale,
        Augmented_APM: Math.round(parseFloat(d.AugAPM) * rounding_scale) / rounding_scale, 
        Augmented_APM_SE: Math.round(parseFloat(d.AugAPMSE) * rounding_scale) / rounding_scale
    };
}

// Primary funtion to convever .csv file into a sortable table 
var create_rpm_table = function(filepath) {
    d3.csv(filepath + "?q" + Math.random(), row_converter, function(error, data) {
        dataset = data; // Store dataset in global variable 

        // Print out the data-set constructed by d3.csv()
        if (error) {
            console.log(error);
        } else {
            console.log(data);
        }

        // Adds and empty table to webpage 
        var table = d3.select('#page-wrap')
                      .append("table");

        // Add table headers to the empty table (<thead>)
        var column_titles = d3.keys(data[0]);
        column_titles.pop() // Remove the Standard Error as a column title
        var headers = table.append("thead")
                           .append("tr")
                           .selectAll("th")
                           .data(column_titles)
                           .enter()
                           .append("th")
                           .text(function (d) {
                                if (d == "Teams") { return "Team(s)" }
                                if (d == "Augmented_APM") { return "Augmented APM" }
                                return d;
                            })

        // Sort the table column by click 
        sort_ascend = true;
        headers.on('click', function(h) {
                console.log("Sorting by: ", h);
                if (sort_ascend) {
                    rows.sort( function(a, b) { return d3.ascending(a[h], b[h]); });                      
                    sort_ascend = false; 
                } else {
                    rows.sort( function(a, b) { return d3.descending(a[h], b[h]); });  
                    sort_ascend = true;
                } 
            })

        // Add rows the the table (<tr> elements) to <tbody>
        var rows = table.append('tbody')
                        .selectAll('tr')
                        .data(data)
                        .enter()
                        .append('tr')

        // Add the cell values to each table 
        rows.attr("class", "data-tr")
            .selectAll('td')
            .data(function (d) {
                return column_titles.map(function (k) { // extracts the name and value 
                        return { 'value': d[k], 'name': k};
                });
            }) 
            .enter()
            .append('td') // Add the cells to each table row 
            .attr('data-th', function (d) { // Adds "data-th" attribute to each cell
                return d.name;
            })
            .text(function (d) { // Adds value to each cell 
                return d.value;
            });

        // Add a chart variable to the table 
        var chartWidth = "100px",
        percent = d3.format(".2%");

        // Create the SVG element where we place our shapes 
        var svg = d3.select("body").append("svg")

        // Add an SVG placeholder element for the location of the chart 
        var svg_chart_width = 100;
        var svg_chart_height = 20;
        var chart_location = d3.select("tbody")
            .selectAll("tr")
            .append("td")
            .attr("class", "chart")
            .append("svg")
            .attr("width", svg_chart_width)
            .attr("height", svg_chart_height)
            .attr("class", "player-chart")

        // Create a scale that maps between APM and the SVG range 
        var apm_max = d3.max(data, function(d) { return d.Augmented_APM; });
        var apm_min = d3.min(data, function(d) { return d.Augmented_APM; });
        var apm_max_se = d3.max(data, function(d) { return d.Augmented_APM_SE });
        
        var chart_scale = d3.scaleLinear()
                            .domain([apm_min - (2 * apm_max_se), apm_max + (2 * apm_max_se)])
                            .range([0, svg_chart_width]);

        var color_scale = d3.scaleLinear()
                            .domain([apm_min, apm_max])
                            .range(["blue", "red"])                        

        // Add the circles to the chart location 
        var sd_line = chart_location.append("line")
                                    .attr("x1", function(d) {
                                        return chart_scale(d.Augmented_APM - (2 * d.Augmented_APM_SE))
                                    })
                                    .attr("x2", function(d) {
                                        return chart_scale(d.Augmented_APM + (2 * d.Augmented_APM_SE))
                                    })
                                    .attr("y1", svg_chart_height / 2) 
                                    .attr("y2", svg_chart_height / 2)
                                    .attr("stroke", function(d) {
                                        return color_scale(d.APM);
                                    })

        // Add lines for the standard errors 
        var line_upper = chart_location.append("line")
                                        .attr("x1", function(d) {
                                            return chart_scale(d.Augmented_APM + (2 * d.Augmented_APM_SE))
                                        })
                                        .attr("x2", function(d) {
                                            return chart_scale(d.Augmented_APM + (2 * d.Augmented_APM_SE))
                                        })
                                        .attr("y1", 1 * (svg_chart_height / 4)) 
                                        .attr("y2", 3 * (svg_chart_height / 4))
                                        .attr("stroke", function(d) {
                                            return color_scale(d.Augmented_APM);
                                        })

        var line_lower = chart_location.append("line")
                                        .attr("x1", function(d) {
                                            return chart_scale(d.Augmented_APM - (2 * d.Augmented_APM_SE))
                                        })
                                        .attr("x2", function(d) {
                                            return chart_scale(d.Augmented_APM - (2 * d.Augmented_APM_SE))
                                        })
                                        .attr("y1", 1 * (svg_chart_height / 4)) 
                                        .attr("y2", 3 * (svg_chart_height / 4))
                                        .attr("stroke", function(d) {
                                            return color_scale(d.Augmented_APM);
                                        })

        var circles = chart_location.append("circle")
                                    .attr("cx", function(d) {
                                        return chart_scale(d.Augmented_APM)
                                    })
                                    .attr("cy", svg_chart_height / 2)
                                    .attr("r", 5)
                                    .attr("fill", function(d) {
                                        return color_scale(d.Augmented_APM);
                                    })
    });
}

// Add a sleep function so that the new click works on a MAC
function sleep(seconds){
    var waitUntil = new Date().getTime() + seconds * 1000;
    while(new Date().getTime() < waitUntil) true;
}

// Updates the table with the new .csv
var update_csv = function() {
    league_val = document.getElementById("league").value;
    season_val = document.getElementById("season").value;
    filepath = "data/" + league_val + "_" + season_val + ".csv"

    // Remove the previous table ---
    d3.selectAll("table").remove();
    sleep(.01);
    create_rpm_table(filepath);
}

// Initialize the table w/ the 2017 EPL results 
create_rpm_table("data/epl_2017.csv?v=1.1")

// When selected changes, call the update .csv function 
d3.selectAll('.selector')
  .on('change', function() {
    update_csv();
  })
