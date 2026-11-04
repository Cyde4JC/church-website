/* ==========================================================
   CONTENT: events, sermons, ministries, leaders, news, gallery
   All entries below are SAMPLES. Edit, delete or add your own.
   Dates use YYYY-MM-DD.
   ========================================================== */
window.DATA = {

  leaders: [
    { name: "Pastor Full Name", role: "Senior Pastor", bio: "Short bio goes here. Years of ministry, calling, family.", photo: "" },
    { name: "Elder Full Name", role: "Church Elder", bio: "Short bio goes here.", photo: "" },
    { name: "Full Name", role: "Worship Leader", bio: "Short bio goes here.", photo: "" },
    { name: "Full Name", role: "Youth Pastor", bio: "Short bio goes here.", photo: "" }
  ],

  beliefs: [
    "The Bible is the inspired and authoritative Word of God.",
    "There is one God, eternally existing as Father, Son and Holy Spirit.",
    "Jesus Christ is God’s Son, who died for our sins and rose again.",
    "Salvation is by grace through faith in Jesus Christ.",
    "The Holy Spirit empowers believers for a godly life and service.",
    "The Church is called to worship, fellowship, discipleship and mission."
  ],

  /* Sermons: use youtube (video ID only) and/or audio (link to mp3). */
  sermons: [
    { title: "Walking in Faith", speaker: "Pastor Full Name", date: "2026-10-25", series: "Faith Series", youtube: "dQw4w9WgXcQ", audio: "", summary: "Sample summary: what this message is about." },
    { title: "The Power of Prayer", speaker: "Pastor Full Name", date: "2026-10-18", series: "Faith Series", youtube: "", audio: "", summary: "Sample summary: what this message is about." },
    { title: "Grace That Restores", speaker: "Guest Speaker", date: "2026-10-11", series: "Grace", youtube: "", audio: "", summary: "Sample summary: what this message is about." },
    { title: "Serving with Joy", speaker: "Pastor Full Name", date: "2026-10-04", series: "Grace", youtube: "", audio: "", summary: "Sample summary: what this message is about." }
  ],

  /* Events: add a "tickets" list to make an event bookable on the Tickets page.
     price 0 = free (reservation only). Remove "tickets" for non-ticketed events. */
  events: [
    /* Featured event: shown with a countdown on the home page. "poster" is the image shown for it.
       To feature a different event, set featured: true on that one instead. */
    { id: "fathers-delight-season-5", featured: true,
      title: "The Father’s Delight Worship Experience – Season 5", date: "2026-11-07", time: "9:00 AM", location: "",
      tagline: "Awesome God of more than enough",
      description: "New Life In Jesus Center presents a day of worship, the Word and fellowship. Together in Worship, Growing in Christ.",
      poster: "images/fathers-delight.jpg",
      programme: [
        { time: "9:00 AM – 10:00 AM", title: "Tea & Snacks", notes: ["Short Film", "Presentations (Ladies & Sunday School)"] },
        { time: "10:00 AM – 10:45 AM", title: "Introduction to the Theme", notes: ["Carol & Manasseh Mcees", "Theme introduction – Hesborn", "Spoken Word – Simo / Manasseh"] },
        { time: "11:00 AM – 12:15 PM", title: "1st Set", notes: [] },
        { time: "12:15 PM – 1:15 PM", title: "Bishop’s Session", notes: [] },
        { time: "1:15 PM – 2:30 PM", title: "2nd Set", notes: [] },
        { time: "2:30 PM – 3:30 PM", title: "Panel Discussion", notes: ["Topics: Discipleship & Ministry; Business & Finances; Sexual Education, Dating, Drugs & Goons; Christianity & Culture"] },
        { time: "3:30 PM – 3:45 PM", title: "Offering & Choir Songs", notes: [] },
        { time: "3:45 PM onwards", title: "Photo Session & Swallowship", notes: ["Guests to leave at their pleasure"] }
      ] },
    /* ---- Sample events below: delete or replace. They show how ticketing works. ---- */
    { id: "thanksgiving-dinner", title: "Annual Thanksgiving Dinner", date: "2026-11-28", time: "6:00 PM", location: "Church Hall",
      description: "An evening of food, fellowship, music and testimonies. Come with family and friends.",
      tickets: [ { type: "Adult", price: 1000 }, { type: "Child (under 12)", price: 500 }, { type: "Table of 8", price: 7000 } ] },
    { id: "youth-conference", title: "Youth Conference", date: "2026-12-05", time: "9:00 AM", location: "Main Sanctuary",
      description: "A day of worship, teaching and mentorship for teens and young adults.",
      tickets: [ { type: "Standard", price: 300 }, { type: "Standard + Lunch", price: 600 } ] },
    { id: "christmas-carols", title: "Christmas Carols Night", date: "2026-12-20", time: "5:00 PM", location: "Main Sanctuary",
      description: "Join the choir and the whole community for an evening of carols.",
      tickets: [ { type: "Free Entry (reserve a seat)", price: 0 } ] },
    { id: "womens-fellowship", title: "Women’s Fellowship Day", date: "2027-01-16", time: "10:00 AM", location: "Church Hall",
      description: "A day of encouragement, prayer and fellowship." }
  ],

  ministries: [
    { name: "Children’s Ministry", icon: "🧒", when: "Sundays, during service", desc: "Sunday school, Bible stories and fun, in a safe and loving space." },
    { name: "Youth Ministry", icon: "🎸", when: "Saturdays, 3:00 PM", desc: "Worship, discipleship, sports and mentorship for teens and young adults." },
    { name: "Women’s Ministry", icon: "🌸", when: "First Saturday monthly", desc: "Fellowship, prayer and growth for women of all ages." },
    { name: "Men’s Ministry", icon: "🛡️", when: "Second Saturday monthly", desc: "Brotherhood, accountability and leadership development." },
    { name: "Worship & Choir", icon: "🎶", when: "Thursdays, 6:00 PM", desc: "Using music and the arts to lead the church into worship." },
    { name: "Outreach & Missions", icon: "🌍", when: "Monthly", desc: "Serving the community through charity, visits and evangelism." }
  ],

  news: [
    { title: "Welcome to our new website", date: "2026-10-28", image: "", /* image: "images/poster.jpg" shows a poster with the post */ body: "Sample announcement. Replace this with news about your church: building projects, new classes, testimonies and more." },
    { title: "Baptism Sunday", date: "2026-10-20", body: "Sample announcement. Those who wish to be baptised should register with the church office." },
    { title: "Food drive for families in need", date: "2026-10-10", body: "Sample announcement. Bring non-perishable items to church every Sunday this month." }
  ],

  /* Gallery: add real photos to the /images folder and set src: "images/photo1.jpg".
     Entries without src show a coloured placeholder. */
  gallery: [
    { caption: "Sunday worship", src: "" }, { caption: "Youth camp", src: "" }, { caption: "Baptism day", src: "" },
    { caption: "Children’s party", src: "" }, { caption: "Community outreach", src: "" }, { caption: "Choir night", src: "" }
  ]
};
