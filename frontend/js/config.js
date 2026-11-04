/* ==========================================================
   CHURCH DETAILS: EDIT THIS FILE FIRST
   Everything here appears automatically across the site.
   ========================================================== */
window.SITE = {
  name: "New Life In Jesus Center",
  shortName: "New Life",
  tagline: "Together in Worship, Growing in Christ.",
  timezone: "+03:00",   // used for event countdowns (Kenya = +03:00)
  denomination: "Your Denomination",
  verse: "“For where two or three gather in my name, there am I with them.” (Matthew 18:20)",

  address: "Kaptembwa, Nakuru",
  city: "Nakuru, Kenya",
  phone: "+254 705 799 597",
  whatsapp: "254705700597",          // international format, no + or spaces
  email: "info@NLJC.org",
  mapEmbed: "https://maps.app.goo.gl/J4t4nwsnVaqHEqAg6", // paste your Google Maps embed URL

  social: {
    facebook: "https://facebook.com/",
    youtube: "https://youtube.com/",
    instagram: "https://instagram.com/",
    twitter: ""
  },

  services: [
    { name: "Sunday Worship (1st Service)", day: "Sunday", time: "8:00 AM – 10:00 AM" },
    { name: "Sunday Worship (2nd Service)", day: "Sunday", time: "10:30 AM – 12:30 PM" },
    { name: "Midweek Bible Study",          day: "Wednesday", time: "6:00 PM – 7:30 PM" },
    { name: "Prayer Meeting",               day: "Friday", time: "5:30 PM – 7:00 PM" }
  ],

  /* Giving details shown on the Give page. Leave a value "" to hide it. */
  giving: {
    mpesaPaybill: "000000",
    mpesaAccount: "TITHE",
    mpesaTill: "",
    bankName: "Family Bank",
    bankAccountName: "New Life In Jesus Center",
    bankAccountNumber: "",
    bankBranch: "Branch name",
    note: "Every gift supports our ministries and community outreach."
  },

  currency: "KES",

  /* Online payments, QR tickets and the admin panel need the Django backend (see /backend).
     true  = use the backend when it is running (falls back to the settings below if not).
     false = static site only: manual payments (paybill/till + WhatsApp). */
  useBackend: false,
  apiBase: "",          // leave "" when Django serves this site (recommended)

  /* Optional: paste a Formspree (formspree.io) endpoint to receive contact,
     prayer-request and ticket-booking forms by email.
     Leave "" and forms will open the visitor's email app instead. */
  formEndpoint: ""
};
