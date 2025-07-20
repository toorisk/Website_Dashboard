// gauges-definition.js - Improved Version

// Create Temperature Gauge
function createTemperatureGauge() {
    var gauge = new LinearGauge({
        renderTo: 'gauge-temperature', // Pastikan ID ini ada di HTML Anda
        width: 120,
        height: 400,
        units: "Suhu (°C)",
        minValue: 0,
        startAngle: 90,
        ticksAngle: 180,
        maxValue: 40, // Pastikan ini sesuai dengan data Anda
        colorValueBoxRect: "#049faa",
        colorValueBoxRectEnd: "#049faa",
        colorValueBoxBackground: "#f1fbfc",
        valueDec: 2,
        valueInt: 2,
        majorTicks: [
            "0", "5", "10", "15", "20", "25", "30", "35", "40" // Sesuaikan ticks dengan maxValue
        ],
        minorTicks: 4,
        strokeTicks: true,
        highlights: [
            {
                "from": 30, // Batas atas yang dianggap tinggi
                "to": 40,
                "color": "rgba(200, 50, 50, .75)" // Merah untuk suhu tinggi
            }
        ],
        colorPlate: "#fff",
        colorBarProgress: "#ff0000", // Merah, konsisten dengan chart suhu
        colorBarProgressEnd: "#ff0000", // Merah
        borderShadowWidth: 0,
        borders: false,
        needleType: "arrow",
        needleWidth: 2,
        needleCircleSize: 7,
        needleCircleOuter: true,
        needleCircleInner: false,
        animationDuration: 1500,
        animationRule: "linear",
        lineGauge: true
    }).draw();
    return gauge;
}

// Create Humidity Gauge (Digunakan untuk TDS)
function createHumidityGauge() {
    var gauge = new LinearGauge({
        renderTo: 'gauge-humidity', // Pastikan ID ini ada di HTML Anda
        width: 120,
        height: 400,
        units: "TDS (PPM)",
        minValue: 0,
        maxValue: 1000, // Sesuaikan batas maksimum TDS jika perlu
        majorTicks: [0, 200, 400, 600, 800, 1000],
        minorTicks: 10,
        strokeTicks: true,
        highlights: [
            {
                "from": 0,
                "to": 500, // Contoh rentang ideal TDS
                "color": "rgba(50, 200, 50, .75)" // Hijau untuk TDS ideal
            },
            {
                "from": 500,
                "to": 1000, // Contoh rentang TDS tinggi
                "color": "rgba(200, 50, 50, .75)" // Merah untuk TDS tinggi
            }
        ],
        colorPlate: "#fff",
        colorBarProgress: "#00add6", // Biru, konsisten dengan chart TDS
        borderShadowWidth: 0,
        borders: false,
        needleType: "arrow",
        needleWidth: 2,
        needleCircleSize: 7,
        needleCircleOuter: true,
        needleCircleInner: false,
        animationDuration: 1500,
        animationRule: "linear",
        lineGauge: true
    }).draw();
    return gauge;
}

// Create Pressure Gauge (Digunakan untuk pH)
function createPressureGauge() {
    var gauge = new LinearGauge({
        renderTo: 'gauge-pressure', // Pastikan ID ini ada di HTML Anda
        width: 120,
        height: 400,
        units: "pH",
        minValue: 0,
        maxValue: 14,
        majorTicks: [
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"
        ],
        minorTicks: 2,
        strokeTicks: true,
        highlights: [
            {
                "from": 0,
                "to": 6.0, // Asam
                "color": "rgba(50, 50, 200, .75)" // Biru
            },
            {
                "from": 6.0,
                "to": 8.0, // Netral/Ideal
                "color": "rgba(50, 200, 50, .75)" // Hijau
            },
            {
                "from": 8.0,
                "to": 14.0, // Basa
                "color": "rgba(200, 50, 50, .75)" // Merah
            }
        ],
        colorPlate: "#fff",
        colorBarProgress: "#e1e437", // Kuning, konsisten dengan chart pH
        borderShadowWidth: 0,
        borders: false,
        needleType: "arrow",
        needleWidth: 2,
        needleCircleSize: 7,
        needleCircleOuter: true,
        needleCircleInner: false,
        animationDuration: 1500,
        animationRule: "linear",
        lineGauge: true
    }).draw();
    return gauge;
}
