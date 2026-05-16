'use strict';

// Mock model for Live Tracking
async function getLiveTrackingData() {
  return {
    stats: {
      check_in_time: '08:32 AM',
      check_out_time: '09:19 PM',
      total_hours: '12:47',
      gps_travel_km: '49.03',
      odometer_km: '0.00',
      visit_travel_km: '0.00'
    },
    location_info: {
      address: 'Kolathur, Chennai, Tamil Nadu, 600099, India',
      timestamp: '31 Mar 2026 09:19 PM-Asia/Kolkata (2 weeks ago)',
      battery: '31%',
      device_brand: 'Redmi',
      device_model: '25057RN09I'
    },
    timeline: [
      {
        type: 'punch-in',
        time: '08:32 AM',
        title: 'Check-In',
        address: 'Revathy Nagar 1st Street, Lakshmipuram, Chennai, Tamil Nadu, 600099, India (13.1...',
        battery: '37%',
        color: 'emerald',
        number: 1
      },
      {
        type: 'halt',
        time: '08:32 AM',
        title: 'Halt',
        duration: '02 hr 17 min',
        address: 'Unknown road\\nClick here to get Address',
        battery: '75%',
        color: 'blue',
        number: 2
      },
      {
        type: 'travel',
        time: '10:49 AM',
        title: 'Travel End Time: 11:01 AM',
        duration: '12 min',
        icon: 'two_wheeler'
      },
      {
        type: 'halt',
        time: '11:01 AM',
        title: 'Halt',
        duration: '41 min',
        address: 'Unknown road\\nClick here to get Address',
        battery: '71%',
        color: 'blue',
        number: 3
      },
      {
        type: 'travel',
        time: '11:42 AM',
        title: 'Travel End Time: 11:45 AM',
        duration: '03 min',
        icon: 'two_wheeler'
      },
      {
        type: 'halt',
        time: '11:45 AM',
        title: 'Halt',
        duration: '11 min',
        address: 'Unknown road',
        battery: '69%',
        color: 'blue',
        number: 4
      }
    ]
  };
}

module.exports = {
  getLiveTrackingData
};
