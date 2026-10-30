// Location gazetteer seed: India, states/UTs, major cities and launch-city localities.
// Centroids are approximate public coordinates for the area (not venues).
// PIN codes listed per locality power PIN search; extend freely.
export type City = { slug: string; name: string; lat: number; lng: number; launch?: boolean; aliases?: string[] };
export type State = { slug: string; name: string; cities?: City[] };

export const states: State[] = [
  { slug: "andhra-pradesh", name: "Andhra Pradesh", cities: [
    { slug: "visakhapatnam", name: "Visakhapatnam", lat: 17.6868, lng: 83.2185, aliases: ["Vizag"] },
    { slug: "vijayawada", name: "Vijayawada", lat: 16.5062, lng: 80.648 },
  ] },
  { slug: "arunachal-pradesh", name: "Arunachal Pradesh" },
  { slug: "assam", name: "Assam", cities: [{ slug: "guwahati", name: "Guwahati", lat: 26.1445, lng: 91.7362 }] },
  { slug: "bihar", name: "Bihar", cities: [{ slug: "patna", name: "Patna", lat: 25.5941, lng: 85.1376 }] },
  { slug: "chhattisgarh", name: "Chhattisgarh", cities: [{ slug: "raipur", name: "Raipur", lat: 21.2514, lng: 81.6296 }] },
  { slug: "goa", name: "Goa", cities: [{ slug: "panaji", name: "Panaji", lat: 15.4909, lng: 73.8278 }] },
  { slug: "gujarat", name: "Gujarat", cities: [
    { slug: "ahmedabad", name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
    { slug: "vadodara", name: "Vadodara", lat: 22.3072, lng: 73.1812 },
    { slug: "surat", name: "Surat", lat: 21.1702, lng: 72.8311 },
  ] },
  { slug: "haryana", name: "Haryana", cities: [{ slug: "gurugram", name: "Gurugram", lat: 28.4595, lng: 77.0266, aliases: ["Gurgaon"] }] },
  { slug: "himachal-pradesh", name: "Himachal Pradesh", cities: [{ slug: "shimla", name: "Shimla", lat: 31.1048, lng: 77.1734 }] },
  { slug: "jharkhand", name: "Jharkhand", cities: [{ slug: "ranchi", name: "Ranchi", lat: 23.3441, lng: 85.3096 }] },
  { slug: "karnataka", name: "Karnataka", cities: [
    { slug: "bengaluru", name: "Bengaluru", lat: 12.9716, lng: 77.5946, launch: true, aliases: ["Bangalore"] },
    { slug: "mysuru", name: "Mysuru", lat: 12.2958, lng: 76.6394, aliases: ["Mysore"] },
    { slug: "mangaluru", name: "Mangaluru", lat: 12.9141, lng: 74.856, aliases: ["Mangalore"] },
  ] },
  { slug: "kerala", name: "Kerala", cities: [
    { slug: "kochi", name: "Kochi", lat: 9.9312, lng: 76.2673, aliases: ["Cochin"] },
    { slug: "thiruvananthapuram", name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366, aliases: ["Trivandrum"] },
  ] },
  { slug: "madhya-pradesh", name: "Madhya Pradesh", cities: [
    { slug: "indore", name: "Indore", lat: 22.7196, lng: 75.8577 },
    { slug: "bhopal", name: "Bhopal", lat: 23.2599, lng: 77.4126 },
  ] },
  { slug: "maharashtra", name: "Maharashtra", cities: [
    { slug: "mumbai", name: "Mumbai", lat: 19.076, lng: 72.8777, aliases: ["Bombay"] },
    { slug: "pune", name: "Pune", lat: 18.5204, lng: 73.8567 },
    { slug: "nagpur", name: "Nagpur", lat: 21.1458, lng: 79.0882 },
  ] },
  { slug: "manipur", name: "Manipur" },
  { slug: "meghalaya", name: "Meghalaya", cities: [{ slug: "shillong", name: "Shillong", lat: 25.5788, lng: 91.8933 }] },
  { slug: "mizoram", name: "Mizoram" },
  { slug: "nagaland", name: "Nagaland" },
  { slug: "odisha", name: "Odisha", cities: [{ slug: "bhubaneswar", name: "Bhubaneswar", lat: 20.2961, lng: 85.8245 }] },
  { slug: "punjab", name: "Punjab", cities: [{ slug: "ludhiana", name: "Ludhiana", lat: 30.901, lng: 75.8573 }] },
  { slug: "rajasthan", name: "Rajasthan", cities: [
    { slug: "jaipur", name: "Jaipur", lat: 26.9124, lng: 75.7873 },
    { slug: "udaipur", name: "Udaipur", lat: 24.5854, lng: 73.7125 },
  ] },
  { slug: "sikkim", name: "Sikkim" },
  { slug: "tamil-nadu", name: "Tamil Nadu", cities: [
    { slug: "chennai", name: "Chennai", lat: 13.0827, lng: 80.2707, aliases: ["Madras"] },
    { slug: "coimbatore", name: "Coimbatore", lat: 11.0168, lng: 76.9558 },
  ] },
  { slug: "telangana", name: "Telangana", cities: [
    { slug: "hyderabad", name: "Hyderabad", lat: 17.385, lng: 78.4867, launch: true, aliases: ["Secunderabad", "Cyberabad"] },
    { slug: "warangal", name: "Warangal", lat: 17.9689, lng: 79.5941 },
  ] },
  { slug: "tripura", name: "Tripura" },
  { slug: "uttar-pradesh", name: "Uttar Pradesh", cities: [
    { slug: "lucknow", name: "Lucknow", lat: 26.8467, lng: 80.9462 },
    { slug: "noida", name: "Noida", lat: 28.5355, lng: 77.391 },
  ] },
  { slug: "uttarakhand", name: "Uttarakhand", cities: [{ slug: "dehradun", name: "Dehradun", lat: 30.3165, lng: 78.0322 }] },
  { slug: "west-bengal", name: "West Bengal", cities: [{ slug: "kolkata", name: "Kolkata", lat: 22.5726, lng: 88.3639, aliases: ["Calcutta"] }] },
  { slug: "andaman-and-nicobar-islands", name: "Andaman and Nicobar Islands" },
  { slug: "chandigarh", name: "Chandigarh", cities: [{ slug: "chandigarh", name: "Chandigarh", lat: 30.7333, lng: 76.7794 }] },
  { slug: "dadra-nagar-haveli-daman-diu", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { slug: "delhi", name: "Delhi", cities: [{ slug: "new-delhi", name: "New Delhi", lat: 28.6139, lng: 77.209, aliases: ["Delhi"] }] },
  { slug: "jammu-and-kashmir", name: "Jammu and Kashmir", cities: [{ slug: "srinagar", name: "Srinagar", lat: 34.0837, lng: 74.7973 }] },
  { slug: "ladakh", name: "Ladakh", cities: [{ slug: "leh", name: "Leh", lat: 34.1526, lng: 77.5771 }] },
  { slug: "lakshadweep", name: "Lakshadweep" },
  { slug: "puducherry", name: "Puducherry", cities: [{ slug: "puducherry", name: "Puducherry", lat: 11.9416, lng: 79.8083, aliases: ["Pondicherry"] }] },
];

export type Locality = { slug: string; name: string; lat: number; lng: number; pincodes?: string[]; aliases?: string[] };

export const localities: Record<string, Locality[]> = {
  "in/telangana/hyderabad": [
    { slug: "gachibowli", name: "Gachibowli", lat: 17.4401, lng: 78.3489, pincodes: ["500032"] },
    { slug: "hitec-city", name: "HITEC City", lat: 17.4474, lng: 78.3762, pincodes: ["500081"], aliases: ["Hitech City", "Cyber Towers"] },
    { slug: "madhapur", name: "Madhapur", lat: 17.4483, lng: 78.3915, pincodes: ["500081"] },
    { slug: "kondapur", name: "Kondapur", lat: 17.46, lng: 78.357, pincodes: ["500084"] },
    { slug: "financial-district", name: "Financial District", lat: 17.417, lng: 78.34, aliases: ["Nanakramguda"] },
    { slug: "manikonda", name: "Manikonda", lat: 17.4053, lng: 78.387, pincodes: ["500089"] },
    { slug: "kukatpally", name: "Kukatpally", lat: 17.4948, lng: 78.3996, pincodes: ["500072"] },
    { slug: "miyapur", name: "Miyapur", lat: 17.4968, lng: 78.3614, pincodes: ["500049"] },
    { slug: "jubilee-hills", name: "Jubilee Hills", lat: 17.4326, lng: 78.4071, pincodes: ["500033"] },
    { slug: "banjara-hills", name: "Banjara Hills", lat: 17.4156, lng: 78.4347, pincodes: ["500034"] },
    { slug: "ameerpet", name: "Ameerpet", lat: 17.4375, lng: 78.4483, pincodes: ["500016"] },
    { slug: "begumpet", name: "Begumpet", lat: 17.4447, lng: 78.4664, pincodes: ["500016"] },
    { slug: "secunderabad", name: "Secunderabad", lat: 17.4399, lng: 78.4983, pincodes: ["500003"] },
    { slug: "tarnaka", name: "Tarnaka", lat: 17.4277, lng: 78.5372, pincodes: ["500017"] },
    { slug: "uppal", name: "Uppal", lat: 17.4058, lng: 78.5591, pincodes: ["500039"] },
    { slug: "lb-nagar", name: "LB Nagar", lat: 17.3457, lng: 78.5522, pincodes: ["500074"] },
    { slug: "kompally", name: "Kompally", lat: 17.5353, lng: 78.4847, pincodes: ["500014"] },
    { slug: "shamshabad", name: "Shamshabad", lat: 17.2403, lng: 78.4294, pincodes: ["501218"], aliases: ["Hyderabad Airport", "RGIA"] },
  ],
  "in/karnataka/bengaluru": [
    { slug: "koramangala", name: "Koramangala", lat: 12.9352, lng: 77.6245, pincodes: ["560034"] },
    { slug: "indiranagar", name: "Indiranagar", lat: 12.9784, lng: 77.6408, pincodes: ["560038"] },
    { slug: "whitefield", name: "Whitefield", lat: 12.9698, lng: 77.75, pincodes: ["560066"] },
    { slug: "marathahalli", name: "Marathahalli", lat: 12.9569, lng: 77.7011, pincodes: ["560037"] },
    { slug: "hsr-layout", name: "HSR Layout", lat: 12.9116, lng: 77.6474, pincodes: ["560102"] },
    { slug: "sarjapur-road", name: "Sarjapur Road", lat: 12.91, lng: 77.685 },
    { slug: "jayanagar", name: "Jayanagar", lat: 12.925, lng: 77.5938, pincodes: ["560011"] },
    { slug: "jp-nagar", name: "JP Nagar", lat: 12.9063, lng: 77.5857, pincodes: ["560078"] },
    { slug: "electronic-city", name: "Electronic City", lat: 12.8452, lng: 77.6602, pincodes: ["560100"] },
    { slug: "mg-road", name: "MG Road", lat: 12.9756, lng: 77.6066, pincodes: ["560001"] },
    { slug: "cubbon-park", name: "Cubbon Park", lat: 12.9763, lng: 77.5929 },
    { slug: "malleshwaram", name: "Malleshwaram", lat: 13.0035, lng: 77.571, pincodes: ["560003"] },
    { slug: "hebbal", name: "Hebbal", lat: 13.0358, lng: 77.597, pincodes: ["560024"] },
    { slug: "yelahanka", name: "Yelahanka", lat: 13.1007, lng: 77.5963, pincodes: ["560064"] },
    { slug: "devanahalli", name: "Devanahalli", lat: 13.1986, lng: 77.7066, aliases: ["Bangalore Airport", "Bengaluru Airport", "Kempegowda Airport"] },
  ],
};
