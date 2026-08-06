import GitHubCalendar from "github-calendar";

import "@/js/pages/main.js";
import "@/css/style.css";
import "@/css/projects.css";

import "github-calendar/dist/github-calendar-responsive.css";

import "@/css/calendar.css";

document.addEventListener("DOMContentLoaded", () => {
    GitHubCalendar(".calendar", "DillanPie", {
        responsive: true,
        global_stats: false,
    });
});

console.log("Projects page loaded.");