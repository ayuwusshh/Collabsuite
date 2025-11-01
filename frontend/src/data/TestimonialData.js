// src/data/testimonials.js
import curlygirl from "../photos/curlygirl.jpg";
import paaji from "../photos/paaji.jpg";
import vanguy from "../photos/vanguy.jpg";
export const TestimonialsPhotos = [
  curlygirl, paaji, vanguy
]
export const Data = [
  {
    id: 1,
    name: "Paramjit Singh",
    role: "Senior Developer",
    company: "EY Technologies",
    content:
      "This suite has completely transformed how our remote team collaborates. We've eliminated the need for 5 different apps!",
    avatar: paaji
  },
  {
    id: 2,
    name: "Lara Xavier",
    role: "Analyst",
    company: "Meta Ai",
    content:
      "The real-time document collaboration is incredible. Our team's productivity has increased by 40% since we started using it.",
    avatar: curlygirl
  },
  {
    id: 3,
    name: "David Lane",
    role: "Design Director",
    company: "CreativeFlow",
    content:
      "The whiteboard feature is a game-changer for our design sprints. It feels like we're all in the same room brainstorming together.",
    avatar: vanguy
  },
];
