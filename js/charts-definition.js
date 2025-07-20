// charts-definition.js - Improved Version

// Fungsi untuk membuat grafik suhu
function createTemperatureChart() {
  var chart = new Highcharts.Chart({
    chart: { 
      renderTo: 'chart-temperature',
      type: 'spline',
      zooming: {
          type: 'x'
      },
      panning: true,
      panKey: 'shift', // Aktifkan panning dengan Shift + klik
      events: {
        load: function() {
          // Opsional: Atur rentang awal atau zoom setelah grafik dimuat
        }
      }
    },
    title: { 
      text: undefined // Judul akan dikelola di HTML atau dihilangkan
    },
    xAxis: {
      type: 'datetime',
      dateTimeLabelFormats: { 
        second: '%H:%M:%S',
        minute: '%H:%M',
        hour: '%H:%M',
        day: '%e. %b',
        week: '%e. %b',
        month: '%b \'%y',
        year: '%Y'
      },
      scrollbar: {
        enabled: true // Aktifkan scrollbar untuk navigasi waktu
      },
      crosshair: true // Tampilkan crosshair untuk pembacaan yang lebih mudah
    },
    yAxis: {
      title: { 
        text: 'Suhu (°C)' // Judul sumbu Y
      },
      labels: {
        format: '{value}°C' // Format label sumbu Y
      }
    },
    series: [{
      name: 'Sensor Suhu', // Label nama seri
      color: '#ff0000', // Warna merah untuk suhu
      data : [],
      dataLabels: { 
        enabled: false // Menonaktifkan label data agar tidak terlalu padat
      },
      marker: {
        enabled: false // Menonaktifkan marker pada titik data
      },
      tooltip: {
        valueSuffix: ' °C' // Suffix untuk tooltip
      }
    }],
    plotOptions: {
      line: { 
        animation: false // Menonaktifkan animasi untuk pembaruan real-time yang lebih cepat
      }
    },
    credits: { 
      enabled: false // Sembunyikan kredit Highcharts
    },
    rangeSelector: {
      enabled: true // Aktifkan range selector
    },
    navigator: {
      enabled: true // Aktifkan navigator
    }
  });
  return chart;
}

// Fungsi untuk membuat grafik TDS
function createHumidityChart(){ // Nama fungsi tetap 'Humidity' tapi digunakan untuk TDS
  var chart = new Highcharts.Chart({
    chart: { 
      renderTo: 'chart-humidity',
      type: 'spline',
      zooming: {
          type: 'x'
      },
      panning: true,
      panKey: 'shift', // Aktifkan panning dengan Shift + klik
      events: {
        load: function() {
          // Opsional: Atur rentang awal atau zoom setelah grafik dimuat
        }
      }
    },
    title: { 
      text: undefined
    },    
    xAxis: {
      type: 'datetime',
      dateTimeLabelFormats: { 
        second: '%H:%M:%S',
        minute: '%H:%M',
        hour: '%H:%M',
        day: '%e. %b',
        week: '%e. %b',
        month: '%b \'%y',
        year: '%Y'
      },
      scrollbar: {
        enabled: true // Aktifkan scrollbar
      },
      crosshair: true
    },
    yAxis: {
      title: { 
        text: 'TDS (PPM)' // Judul sumbu Y
      },
      labels: {
        format: '{value} PPM' // Format label sumbu Y
      }
    },
    series: [{
      name: 'Sensor TDS', // Label nama seri
      color: '#00add6', // Warna biru untuk TDS
      dataLabels: { 
        enabled: false 
      },
      marker: {
        enabled: false
      },
      tooltip: {
        valueSuffix: ' PPM'
      }
    }],
    plotOptions: {
      line: { 
        animation: false
      }
    },
    credits: { 
      enabled: false 
    },
    rangeSelector: {
      enabled: true
    },
    navigator: {
      enabled: true
    }
  });
  return chart;
}

// Fungsi untuk membuat grafik pH
function createPressureChart() { // Nama fungsi tetap 'Pressure' tapi digunakan untuk pH
  var chart = new Highcharts.Chart({
    chart: { 
      renderTo: 'chart-pressure',
      type: 'spline',
      zooming: {
          type: 'x'
      },
      panning: true,
      panKey: 'shift', // Aktifkan panning dengan Shift + klik
      events: {
        load: function() {
          // Opsional: Atur rentang awal atau zoom setelah grafik dimuat
        }
      }
    },
    title: { 
      text: undefined
    },    
    xAxis: {
      type: 'datetime',
      dateTimeLabelFormats: { 
        second: '%H:%M:%S',
        minute: '%H:%M',
        hour: '%H:%M',
        day: '%e. %b',
        week: '%e. %b',
        month: '%b \'%y',
        year: '%Y'
      },
      scrollbar: {
        enabled: true // Aktifkan scrollbar
      },
      crosshair: true
    },
    yAxis: {
      title: { 
        text: 'pH' // Judul sumbu Y
      },
      labels: {
        format: '{value} pH' // Format label sumbu Y
      },
      min: 0, // Batas bawah pH
      max: 14 // Batas atas pH
    },
    series: [{
      name: 'Sensor pH', // Label nama seri
      color: '#e1e437', // Warna kuning untuk pH
      dataLabels: { 
        enabled: false 
      },
      marker: {
        enabled: false
      },
      tooltip: {
        valueSuffix: ' pH'
      }
    }],
    plotOptions: {
      line: { 
        animation: false
      }
    },
    credits: { 
      enabled: false 
    },
    rangeSelector: {
      enabled: true
    },
    navigator: {
      enabled: true
    }
  });
  return chart;
}
