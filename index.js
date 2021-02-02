const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");

//Kopfzeile: Geo Point;Ortsname;Postleitzahl
//Formatierung Eintrag: long, lat; plz; name
const SOURCE_FILE = "in.csv"; //input file
const EXPORT_NAME = "out.csv" //output file

//Liste aller Ausgangspunkte als Postleitzahl
const start = [
  "13509",
  "01159",
  "45145",
  "22525",
  "30419",
  "76199",
  "04159",
  "80686",
  "90431",
  "64546",
  "70794",
];
let start_points = [];

function distance(from, to) {
  let dx = 111.3 * (from.lat - to.lat);
  let dy = 71.5 * (from.long - to.long);

  return Math.sqrt(dx * dx + dy * dy);
}

const csvWriter = createCsvWriter({
  path: `${EXPORT_NAME}`,
  header: [
    { id: "to", title: "To" },
    { id: "from", title: "From" },
    { id: "distance", title: "Distance" },
  ],
  fieldDelimiter: ";",
});

getZipCodes((start_points, all) => {
  result = [];
  for (i = 0; i < all.length; i++) {
    console.log(i)
    let min_dis = -1;
    let min_point;
    for (j = 0; j < start_points.length; j++) {
      let n = distance(start_points[j], all[i]);
      if (min_dis === -1 || min_dis > n) {
        min_dis = n;
        min_point = start_points[j];
      }
    }
    result.push({ to: all[i].code, from: min_point.code, distance: min_dis });
  }
  console.log("writing");
  csvWriter.writeRecords(result).then(() => process.exit(0));
});

async function getZipCodes(callback) {
  let all = [];
  await fs
    .createReadStream(SOURCE_FILE)
    .pipe(csv({ separator: ";", mapHeaders: ({ header, index }) => index }))
    .on("data", async (row) => {
      var cords = row["0"].split(","); 
      const x = {
        lat: parseFloat(cords[0]),
        long: parseFloat(cords[1]),
        name: row["1"],
        code: row["2"],
      };
      all.push(x);
      for (i = 0; i < start.length; i++) {
        if (x.code === start[i]) {
          start_points.push(x);
        }
      }
    })
    .on("end", () => {
      callback(start_points, all);
    });
}