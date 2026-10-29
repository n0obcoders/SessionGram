'use strict';
/* SessionGram web client: vanilla JS, no build step. Developed by Nitin Shukla (github.com/n0obcoders). */

// ------------------------------------------------------------------ icons
const ICONS = {
  menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  search: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  send: 'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z',
  attach: 'M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 015 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 005 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z',
  profile: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 01-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 01-6 3.22z',
  group: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  channel: 'M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z',
  person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  folder: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
  bookmark: 'M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z',
  settings: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  archive: 'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z',
  pin: 'M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z',
  mute: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
  done: 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z',
  done_all: 'M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z',
  reply: 'M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z',
  forward: 'M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z',
  copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  delete: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  chat: 'M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z',
  key: 'M12.65 10A5.99 5.99 0 007 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 005.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
  bell: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  pie: 'M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z',
  laptop: 'M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z',
  globe: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 015.08 16zm2.95-8H5.08a7.987 7.987 0 014.33-3.56A15.65 15.65 0 008.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z',
  logout: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  refresh: 'M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
  upload: 'M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z',
  add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  download: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  file: 'M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z',
  eye: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
  palette: 'M12 3a9 9 0 000 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
  moon: 'M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z',
  lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
  play: 'M8 5v14l11-7z',
  down: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
  at: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
  verified: 'M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z',
  link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
  phone: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
  camera: 'M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
  star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  read: 'M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z',
  inbox: 'M19 3H4.99C3.89 3 3 3.9 3 5v14c0 1.1.89 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z',
  mic: 'M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z',
  unread: 'M20 6.54v10.91c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h10.1c-.06.32-.1.66-.1 1 0 2.76 2.24 5 5 5 .36 0 .7-.04 1.03-.11zM22 5c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM4 8l7 4.5 3.13-2.02A6.97 6.97 0 0112.07 6H4v2z',
  clock: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
  silent: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.24.06-.47.15-.69.23L18 13.1V16zm-12.73-12L4 5.27l2.81 2.81C6.29 9.07 6 10.22 6 11v5l-2 2v1h14.73l2 2L22 19.73 5.27 4z',
  code: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
  heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  github: 'M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 007.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 015.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0023.5 12C23.5 5.65 18.35.5 12 .5z',
  sparkle: 'M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z',
};
const icon = (n) => `<svg viewBox="0 0 24 24"><path d="${ICONS[n] || ICONS.info}"/></svg>`;

// ------------------------------------------------------------------ utils
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
const store = {
  get(k, d) { try { const v = localStorage.getItem('sg_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('sg_' + k, JSON.stringify(v)); } catch { } },
};
const isTouch = matchMedia('(pointer: coarse)').matches;
function fmtSize(b) { if (!b && b !== 0) return ''; const u = ['B', 'KB', 'MB', 'GB']; let i = 0; while (b >= 1024 && i < 3) { b /= 1024; i++; } return b.toFixed(i ? 1 : 0) + ' ' + u[i]; }
function fmtDur(s) { s = s || 0; return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); }
function fmtClock(t) { return new Date(t * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function fmtTime(t) {
  if (!t) return '';
  const d = new Date(t * 1000), n = new Date();
  if (d.toDateString() === n.toDateString()) return fmtClock(t);
  if ((n - d) / 864e5 < 6) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', ...(d.getFullYear() !== n.getFullYear() ? { year: '2-digit' } : {}) });
}
function fmtDay(t) {
  const d = new Date(t * 1000), n = new Date();
  if (d.toDateString() === n.toDateString()) return 'Today';
  const y = new Date(n); y.setDate(n.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'long', day: 'numeric', ...(d.getFullYear() !== n.getFullYear() ? { year: 'numeric' } : {}) });
}
function fmtNum(n) { if (n == null) return ''; if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'; return String(n); }
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

let toastT;
function toast(msg, onClick) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  t.onclick = () => { t.classList.remove('on'); onClick && onClick(); };
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), onClick ? 4500 : 2600);
}

// ------------------------------------------------------------------ state
const S = {
  accounts: [], aid: store.get('aid', null), loadError: null,
  dialogs: {}, folders: {}, folder: store.get('folder', 'all'), renderLimit: 120,
  chat: null,
  settings: Object.assign({ theme: 'system', notify: true, sound: true, allAccounts: true, autoload: true, fs: 16, typing: true, lockAfter: 60 }, store.get('settings', {})),
};
const acc = (id = S.aid) => S.accounts.find((a) => a.id === id);
const dialogsOf = (id = S.aid) => S.dialogs[id] || null;
const findDialog = (pid, aid = S.aid) => (S.dialogs[aid] || []).find((d) => String(d.id) === String(pid));
function saveSettings() { store.set('settings', S.settings); applySettings(); }
function applySettings() {
  const dark = S.settings.theme === 'dark' || (S.settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.setProperty('--fs', S.settings.fs + 'px');
  $('meta[name=theme-color]').content = dark ? '#111622' : '#ffffff';
  try { window.SGBridge && SGBridge.setDark(dark); } catch { }
}

// ------------------------------------------------------------------ api
async function api(path, opts = {}) {
  const o = { credentials: 'same-origin', ...opts };
  if (o.json !== undefined) { o.method = o.method || 'POST'; o.headers = { 'Content-Type': 'application/json' }; o.body = JSON.stringify(o.json); delete o.json; }
  const r = await fetch(path, o);
  if (r.status === 401) { showLogin(); throw new Error('Please log in'); }
  let data = null; try { data = await r.json(); } catch { }
  if (!r.ok) throw new Error((data && (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))) || 'HTTP ' + r.status);
  return data;
}
const A = (p, aid = S.aid) => `/api/a/${aid}${p}`;

// ------------------------------------------------------------------ navigation (history-backed stack)
const stack = [];
let afterPop = null;
history.replaceState({ n: 0 }, '');
function pushEntry(close) { stack.push(close); history.pushState({ n: stack.length }, ''); }
function back(then) { if (!stack.length) { then && then(); return; } afterPop = then || null; history.back(); }
function closeAll(then) { if (!stack.length) { then && then(); return; } afterPop = then || null; history.go(-stack.length); }
window.addEventListener('popstate', (e) => {
  const n = (e.state && e.state.n) || 0;
  while (stack.length > n) { try { stack.pop()(); } catch (err) { console.error(err); } }
  if (afterPop) { const f = afterPop; afterPop = null; setTimeout(f, 0); }
});

function openPage({ title = '', sub = '', head, actions = '', body = '', plain = false, onClose }) {
  const el = h(`<section class="screen page">
    <header class="bar"><button class="icon-btn pg-back">${icon('back')}</button>
      ${head || `<div class="bar-title"><span>${esc(title)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`}
      ${actions}</header>
    <div class="page-body scroll ${plain ? 'plain' : ''}"></div></section>`);
  const b = el.querySelector('.page-body');
  if (typeof body === 'string') b.innerHTML = body; else if (body) b.appendChild(body);
  el.querySelector('.pg-back').onclick = () => back();
  $('#pages').appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  pushEntry(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 230); onClose && onClose(); });
  return el;
}

function sheet(title, items, onReact) {
  const b = $('#sheetBody');
  b.innerHTML = (onReact ? `<div class="react-strip">${QUICK_REACTIONS.map((e) => `<button data-react="${e}">${e}</button>`).join('')}</div>` : '') +
    (title ? `<div class="sh-title">${esc(title)}</div>` : '') +
    items.filter(Boolean).map((it, i) => `<div class="menu-row ${it.red ? 'red' : ''}" data-i="${i}">${icon(it.icon)}<span>${esc(it.label)}</span></div>`).join('');
  const list = items.filter(Boolean);
  $('#sheet').classList.remove('hidden');
  pushEntry(() => $('#sheet').classList.add('hidden'));
  b.onclick = (e) => {
    const rx = e.target.closest('[data-react]'); if (rx && onReact) { back(() => onReact(rx.dataset.react)); return; }
    const r = e.target.closest('[data-i]'); if (r) back(() => list[+r.dataset.i].fn());
  };
}
$('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') back(); });

function viewer(html) {
  const v = $('#viewer');
  v.innerHTML = `<button class="icon-btn" style="left:8px">${icon('close')}</button>${html}`;
  v.classList.remove('hidden');
  pushEntry(() => { v.classList.add('hidden'); v.innerHTML = ''; });
  v.querySelector('.icon-btn').onclick = () => back();
  v.onclick = (e) => { if (e.target === v) back(); };
}

function onLongPress(el, fn) {
  let t = null;
  el.addEventListener('touchstart', (e) => { t = setTimeout(() => { t = null; el._lp = Date.now(); fn(e); }, 480); }, { passive: true });
  const c = () => { if (t) clearTimeout(t); t = null; };
  el.addEventListener('touchend', c); el.addEventListener('touchmove', c, { passive: true }); el.addEventListener('touchcancel', c);
  el.addEventListener('contextmenu', (e) => { e.preventDefault(); if (!el._lp || Date.now() - el._lp > 800) fn(e); });
}
const wasLong = (el) => el._lp && Date.now() - el._lp < 800;

// ------------------------------------------------------------------ avatars
const COLORS = ['#e17076', '#7bc862', '#e5ca77', '#65aadd', '#a695e7', '#ee7aae', '#6ec9cb', '#faa774'];
function initials(name) { const p = String(name || '?').trim().split(/\s+/).filter((x) => /[\p{L}\p{N}]/u.test(x)); const f = (s) => (s ? Array.from(s)[0] : ''); return ((f(p[0]) || '?') + f(p[1])).toUpperCase(); }
function avatar(aid, peer, name, hasPhoto, cls = '', isSelf = false) {
  if (isSelf) return `<div class="avatar ${cls}" style="background:#65aadd">${icon('bookmark')}</div>`;
  const n = Math.abs(parseInt(String(peer).replace(/\D/g, '').slice(-6) || '0', 10));
  const img = hasPhoto ? `<img loading="lazy" alt="" src="/api/a/${aid}/avatar/${encodeURIComponent(peer)}" onerror="this.remove()">` : '';
  return `<div class="avatar ${cls}" style="background:${COLORS[n % 8]}">${esc(initials(name))}${img}</div>`;
}

// ------------------------------------------------------------------ login
function showLogin() {
  $('#login').classList.remove('hidden'); $('#main').classList.add('hidden');
  setTimeout(() => $('#loginPass').focus(), 50);
}
async function doLogin() {
  $('#loginErr').textContent = '';
  try {
    await api('/api/login', { json: { password: $('#loginPass').value } });
    $('#login').classList.add('hidden'); start();
  } catch (e) { $('#loginErr').textContent = e.message; }
}
$('#loginBtn').onclick = doLogin;
$('#loginPass').onkeydown = (e) => { if (e.key === 'Enter') doLogin(); };

// ------------------------------------------------------------------ boot
async function init() {
  applySettings();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applySettings);
  let auth = {};
  try { auth = await (await fetch('/api/auth', { credentials: 'same-origin' })).json(); } catch { }
  // In a browser the credits intro plays once per visit; the Android app plays it natively before loading this page.
  let seen = true; try { seen = sessionStorage.getItem('sg_intro_seen') === '1'; } catch { }
  if (!auth.app && !seen) { location.replace('/static/intro.html'); return; }
  if (!auth.ok) return showLogin();
  if (lockEnabled()) showLock();
  start();
}
let started = false;
async function start() {
  $('#main').classList.remove('hidden');
  if (!started) { started = true; bindMain(); connectWS(); }
  await loadAccounts();
}
async function loadAccounts() {
  const r = await api('/api/accounts');
  S.accounts = r.accounts; S.loadError = r.error; S.source = r.source; S.appMode = !!r.app;
  if (!acc(S.aid)) S.aid = (S.accounts.find((a) => a.status === 'online') || S.accounts[0] || {}).id || null;
  store.set('aid', S.aid);
  scheduleDrawer(); renderMain();
  if (acc()?.status === 'online' && !dialogsOf()) loadDialogs(S.aid);
}
async function loadDialogs(aid, refresh = false) {
  const a = acc(aid);
  if (!a || a.status !== 'online') return;
  a._loading = true; if (aid === S.aid) renderMain();
  try {
    const r = await api(A(`/dialogs${refresh ? '?refresh=1' : ''}`, aid));
    S.dialogs[aid] = r.dialogs; S.folders[aid] = r.folders; a.unread = r.unread;
  } catch (e) { toast(e.message); }
  a._loading = false;
  if (aid === S.aid) renderMain();
  scheduleDrawer();
}
function switchAccount(id) {
  if (id === S.aid) return;
  S.aid = id; store.set('aid', id); S.folder = 'all'; S.renderLimit = 120;
  scheduleDrawer(); renderMain();
  if (acc()?.status === 'online' && !dialogsOf()) loadDialogs(id);
  $('#chatList').scrollTop = 0;
}

// ------------------------------------------------------------------ main screen
function bindMain() {
  $('[data-icon=menu]').innerHTML = icon('menu');
  $('[data-icon=search]').innerHTML = icon('search');
  $('[data-icon=inbox]').innerHTML = icon('inbox');
  $('#fab').innerHTML = icon('edit');
  $('#menuBtn').onclick = openDrawer;
  $('#scrim').onclick = () => back();
  $('#searchBtn').onclick = () => openSearch();
  $('#inboxBtn').onclick = () => openInbox();
  $('#footAbout').onclick = (e) => { e.preventDefault(); back(openAbout); };
  $('#fab').onclick = () => sheet('New', [
    { icon: 'person', label: 'New Message', fn: openContacts },
    { icon: 'at', label: 'Find by username / link', fn: () => openSearch() },
    { icon: 'group', label: 'New Group', fn: () => openCreate('group') },
    { icon: 'channel', label: 'New Channel', fn: () => openCreate('channel') },
  ]);
  const list = $('#chatList');
  onLongPress(list, (e) => { const r = e.target.closest && e.target.closest('[data-peer]'); if (r) { r._lp = Date.now(); dialogMenu(r.dataset.peer); } });
  list.addEventListener('scroll', () => {
    if (list.scrollTop + list.clientHeight > list.scrollHeight - 600) {
      const total = filteredDialogs().length;
      if (S.renderLimit < total) { S.renderLimit += 150; renderList(); }
    }
  });
  list.addEventListener('click', (e) => {
    const r = e.target.closest('[data-peer]');
    if (r && !wasLong(r)) openChat(r.dataset.peer);
    if (e.target.closest('.archived-row')) openArchived();
    const btn = e.target.closest('[data-act]');
    if (btn) mainAction(btn.dataset.act);
  });
  $('#tabs').addEventListener('click', (e) => {
    const t = e.target.closest('[data-f]'); if (!t) return;
    S.folder = t.dataset.f === 'all' ? 'all' : +t.dataset.f; store.set('folder', S.folder); S.renderLimit = 120;
    renderMain(); $('#chatList').scrollTop = 0;
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S.chat) markReadSoon(); });
}
function mainAction(act) {
  if (act === 'reconnect') reconnectAccount(S.aid);
  if (act === 'manager') openAccountsManager();
  if (act === 'add') openSessionLogin();
  if (act === 'phone') openPhoneLogin();
  if (act === 'reload') loadDialogs(S.aid, true);
}
async function reconnectAccount(id) {
  toast('Reconnecting…');
  try { const info = await api(`/api/a/${id}/reconnect`, { method: 'POST' }); updateAccount(info); if (info.status === 'online') loadDialogs(id); else toast(info.error || 'Still offline'); }
  catch (e) { toast(e.message); }
}
function updateAccount(info) {
  const i = S.accounts.findIndex((a) => a.id === info.id);
  if (i >= 0) S.accounts[i] = Object.assign(S.accounts[i], info); else S.accounts.push(info);
  scheduleDrawer();
  if (info.id === S.aid) { renderMainHead(); if (info.status === 'online' && !dialogsOf() && !acc()._loading) loadDialogs(info.id); }
}

function filteredDialogs(aid = S.aid) {
  const ds = dialogsOf(aid) || [];
  let out;
  if (S.folder === 'all') out = ds.filter((d) => !d.archived);
  else out = ds.filter((d) => (d.folders || []).includes(S.folder));
  return sortDialogs(out, S.folder === 'all');
}
function sortDialogs(arr, pinnedFirst = true) {
  return arr.slice().sort((a, b) => (pinnedFirst ? (b.pinned - a.pinned) : 0) || (b.date || 0) - (a.date || 0));
}
function renderMain() { renderMainHead(); renderTabs(); renderList(); }
function renderMainHead() {
  const a = acc();
  $('#mainTitle span').textContent = a ? a.name : 'SessionGram';
  $('#mainTitle span').classList.toggle('brand-title', !a);
  let sub = '';
  if (a) sub = a.status === 'online' ? (a._loading && !dialogsOf() ? 'Updating…' : (a.username ? '@' + a.username : a.phone || '')) : a.status === 'connecting' ? 'Connecting…' : 'Offline';
  $('#mainSub').textContent = sub;
  const other = S.accounts.filter((x) => x.id !== S.aid).reduce((s, x) => s + (x.unread || 0), 0);
  const badge = other ? `<span class="badge menu-badge">${other > 999 ? '999+' : other}</span>` : '';
  if ($('#menuBtn')._b !== badge) { $('#menuBtn').innerHTML = icon('menu') + badge; $('#menuBtn')._b = badge; }
  document.title = (a && a.unread ? `(${a.unread}) ` : '') + 'SessionGram';
}
function renderTabs() {
  const f = S.folders[S.aid] || [];
  const tabs = $('#tabs');
  if (!f.length) { tabs.innerHTML = ''; if (S.folder !== 'all') S.folder = 'all'; return; }
  if (S.folder !== 'all' && !f.find((x) => x.id === S.folder)) S.folder = 'all';
  const ds = dialogsOf() || [];
  const cnt = (pred) => ds.filter((d) => pred(d) && d.unread > 0 && !d.muted).length;
  tabs.innerHTML = `<div class="tab ${S.folder === 'all' ? 'on' : ''}" data-f="all">All chats${(() => { const c = cnt((d) => !d.archived); return c ? `<span class="badge">${c}</span>` : ''; })()}</div>` +
    f.map((x) => { const c = cnt((d) => (d.folders || []).includes(x.id)); return `<div class="tab ${S.folder === x.id ? 'on' : ''}" data-f="${x.id}">${esc(x.emoticon ? '' : '')}${esc(x.title)}${c ? `<span class="badge">${c}</span>` : ''}</div>`; }).join('');
  tabs.querySelector('.on')?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
}
function dialogRow(d, aid = S.aid) {
  const check = d.last_out && !d.is_self && d.kind !== 'channel' ? (d.read_outbox >= d.last_id ? icon('done_all') : icon('done')) : '';
  let right = '';
  if (d.mentions > 0) right += `<span class="badge at">@</span>`;
  if (d.unread > 0) right += `<span class="badge ${d.muted ? 'muted' : ''}">${d.unread > 99999 ? fmtNum(d.unread) : d.unread}</span>`;
  else if (d.pinned) right += `<span>${icon('pin').replace('<svg', '<svg class="pin-ic"')}</span>`;
  const kindIc = d.kind === 'channel' ? icon('channel') : d.kind === 'group' ? icon('group') : '';
  return `<div class="row${d.pinned && !d.archived ? ' pinned-row' : ''}" data-peer="${d.id}">
    ${avatar(aid, d.id, d.name, d.has_photo, '', d.is_self)}
    <div class="body">
      <div class="l1">${kindIc ? kindIc.replace('<svg', '<svg class="ic"') : ''}<span class="name">${esc(d.name)}</span>
        ${d.verified ? icon('verified').replace('<svg', '<svg class="verified"') : ''}${d.muted ? icon('mute').replace('<svg', '<svg class="ic"') : ''}
        <span class="time">${check}${fmtTime(d.date)}</span></div>
      <div class="l2"><span class="msg">${d.last_sender ? `<b>${esc(d.last_sender)}: </b>` : ''}${esc(d.last)}</span>${right}</div>
    </div></div>`;
}
function renderList() {
  const list = $('#chatList');
  const a = acc();
  let html = '';
  if (S.loadError) html += `<div class="banner">${esc(S.loadError)} <a href="#" data-act="manager" style="color:inherit;font-weight:500">Open account manager</a></div>`;
  if (!S.accounts.length) {
    list.innerHTML = html + `<div class="empty"><div class="empty-art">${icon('sparkle')}</div><b style="font-size:19px;color:var(--text)">Welcome to SessionGram</b><br>Log in to as many Telegram accounts as you like and use them all side by side.<br><br>
      <button class="btn grad" data-act="phone">Log in with phone number</button><br><br>
      <button class="btn ghost" data-act="manager">Upload sessions file</button><br><br><button class="btn ghost" data-act="add">Use a session string</button></div>`;
    return;
  }
  if (a && a.status !== 'online') {
    list.innerHTML = html + `<div class="empty"><b>${esc(a.name)}</b><br>${a.status === 'connecting' ? 'Connecting…' : esc(a.error || 'Not connected')}<br><br>
      ${a.status !== 'connecting' ? '<button class="btn" data-act="reconnect">Reconnect</button>' : ''}</div>`;
    return;
  }
  const ds = dialogsOf();
  if (!ds) { list.innerHTML = html + '<div class="skeleton"></div>'.repeat(8); return; }
  if (S.folder === 'all') {
    const arch = ds.filter((d) => d.archived);
    if (arch.length) {
      const un = arch.filter((d) => d.unread > 0).length;
      const last = sortDialogs(arch, false).slice(0, 3).map((d) => d.name).join(', ');
      html += `<div class="row archived-row"><div class="avatar">${icon('archive')}</div><div class="body"><div class="l1"><span class="name">Archived Chats</span></div>
        <div class="l2"><span class="msg">${esc(last)}</span>${un ? `<span class="badge muted">${un}</span>` : ''}</div></div></div>`;
    }
  }
  const items = filteredDialogs();
  html += items.slice(0, S.renderLimit).map((d) => dialogRow(d)).join('');
  if (!items.length) html += `<div class="empty">No chats here yet.</div>`;
  if (items.length > S.renderLimit) html += `<div class="list-more">Loading more…</div>`;
  if (list._html === html) return;        // nothing changed: skip the DOM work entirely
  const st = list.scrollTop;
  list.innerHTML = html; list._html = html;
  list.scrollTop = st;
}
let renderQueued = false;
function scheduleRender() {
  if (renderQueued) return; renderQueued = true;
  requestAnimationFrame(() => { renderQueued = false; renderMainHead(); renderTabs(); renderList(); S.redrawArchived && S.redrawArchived(); });
}
// The drawer lists every account; with 100+ accounts, rebuild it at most once per frame and only while it is open.
let drawerQueued = false, drawerDirty = true;
function scheduleDrawer() {
  drawerDirty = true;
  if (drawerQueued || !$('#drawer').classList.contains('on')) return;
  drawerQueued = true;
  requestAnimationFrame(() => { drawerQueued = false; renderDrawer(); });
}
function dialogMenu(pid, aid = S.aid) {
  const d = findDialog(pid, aid); if (!d) return;
  sheet(d.name, [
    !d.archived && { icon: 'pin', label: d.pinned ? 'Unpin' : 'Pin to top', fn: () => dialogAction(aid, pid, '/pin_chat', { pin: !d.pinned }, d.pinned ? 'Unpinned' : 'Pinned') },
    d.unread > 0 ? { icon: 'read', label: 'Mark as read', fn: () => markRead(aid, pid) }
      : { icon: 'unread', label: 'Mark as unread', fn: () => dialogAction(aid, pid, '/mark_unread', {}, 'Marked as unread') },
    { icon: d.muted ? 'bell' : 'mute', label: d.muted ? 'Unmute' : 'Mute', fn: () => setMute(pid, !d.muted, aid) },
    !d.is_self && { icon: 'archive', label: d.archived ? 'Unarchive' : 'Archive', fn: () => dialogAction(aid, pid, '/archive', { archive: !d.archived }, d.archived ? 'Moved back to chats' : 'Archived') },
    { icon: 'info', label: 'View info', fn: () => openInfo(pid) },
    d.kind !== 'channel' && { icon: 'refresh', label: 'Clear history', fn: () => clearHistory(aid, pid) },
    { icon: 'delete', label: d.kind === 'user' || d.kind === 'bot' ? 'Delete chat' : 'Leave', red: true, fn: () => leaveChat(pid) },
  ]);
}
async function dialogAction(aid, pid, path, extra, done) {
  try {
    const r = await api(A(path, aid), { json: { peer: pid, ...extra } });
    if (r.dialog) upsertDialog(aid, r.dialog);
    if (aid === S.aid) scheduleRender();
    toast(done);
  } catch (e) { toast(e.message); }
}
async function clearHistory(aid, pid) {
  const d = findDialog(pid, aid);
  if (!confirm(`Clear all messages in "${d ? d.name : 'this chat'}" for you?`)) return;
  try {
    const r = await api(A('/clear_history', aid), { json: { peer: pid } });
    if (r.dialog) upsertDialog(aid, r.dialog);
    const C = S.chat; if (C && C.aid === aid && String(C.id) === String(pid)) { C.list = []; C.byId.clear(); C.done = false; C.msgsEl.innerHTML = ''; loadOlder(C); }
    scheduleRender(); toast('History cleared');
  } catch (e) { toast(e.message); }
}
async function markRead(aid, pid) {
  try { const r = await api(A(`/read/${pid}`, aid), { method: 'POST' }); const d = findDialog(pid, aid); if (d) { d.unread = 0; d.mentions = 0; } const a = acc(aid); if (a) a.unread = r.unread; scheduleRender(); scheduleDrawer(); } catch (e) { toast(e.message); }
}
async function setMute(pid, on, aid = S.aid) {
  try { await api(A('/mute', aid), { json: { peer: pid, mute: on } }); const d = findDialog(pid, aid); if (d) d.muted = on; scheduleRender(); toast(on ? 'Muted' : 'Unmuted'); } catch (e) { toast(e.message); }
}
async function leaveChat(pid) {
  const d = findDialog(pid);
  if (!confirm(`${d && (d.kind === 'user' || d.kind === 'bot') ? 'Delete chat with' : 'Leave'} "${d ? d.name : 'this chat'}"?`)) return;
  try {
    await api(A('/leave'), { json: { peer: pid } });
    S.dialogs[S.aid] = (dialogsOf() || []).filter((x) => String(x.id) !== String(pid));
    scheduleRender(); toast('Done');
    if (S.chat && String(S.chat.id) === String(pid)) closeAll();
  } catch (e) { toast(e.message); }
}
function openArchived() {
  const el = openPage({ title: 'Archived Chats', plain: true, onClose: () => { S.redrawArchived = null; } });
  const body = el.querySelector('.page-body');
  const draw = () => {
    const items = sortDialogs((dialogsOf() || []).filter((d) => d.archived), false);
    body.innerHTML = items.map((d) => dialogRow(d)).join('') || '<div class="empty">No archived chats</div>';
  };
  draw();
  S.redrawArchived = draw;
  body.onclick = (e) => { const r = e.target.closest('[data-peer]'); if (r && !wasLong(r)) openChat(r.dataset.peer); };
  onLongPress(body, (e) => { const r = e.target.closest && e.target.closest('[data-peer]'); if (r) { r._lp = Date.now(); dialogMenu(r.dataset.peer); } });
}

// ------------------------------------------------------------------ drawer
function openDrawer() {
  $('#drawer').classList.add('on'); $('#scrim').classList.add('on');
  if (drawerDirty) renderDrawer();
  pushEntry(() => { $('#drawer').classList.remove('on'); $('#scrim').classList.remove('on'); });
}
const ADD_ACCOUNT_ROW = () => `<div class="acc-row" data-act="add"><div class="avatar" style="background:var(--accent-soft);color:var(--accent)">${icon('add')}</div><div class="n" style="font-weight:500">Add account</div></div>`;
function accountRows() {
  const q = (S.accFilter || '').toLowerCase();
  const list = q ? S.accounts.filter((x) => (x.name || '').toLowerCase().includes(q) || (x.phone || '').includes(q) || (x.username || '').toLowerCase().includes(q)) : S.accounts;
  return list.map((x) => `<div class="acc-row ${x.id === S.aid ? 'cur' : ''}" data-acc="${x.id}">
      <div style="position:relative">${avatar(x.id, 'me', x.name, x.status === 'online' && x.has_photo)}<span class="dot ${x.status}"></span></div>
      <div style="flex:1;min-width:0"><div class="n">${esc(x.name)}</div><div class="s">${esc(x.status === 'online' ? (x.phone || '') : x.status === 'connecting' ? 'connecting…' : (x.error || x.status))}</div></div>
      ${x.unread ? `<span class="badge">${x.unread > 9999 ? fmtNum(x.unread) : x.unread}</span>` : ''}</div>`).join('') || '<div class="empty" style="padding:16px">No matching account</div>';
}
function renderDrawer() {
  drawerDirty = false;
  const a = acc();
  $('#drawerHead').innerHTML = a
    ? `${avatar(a.id, 'me', a.name, a.has_photo)}<div class="n">${esc(a.name)}</div><div class="p">${esc(a.phone || '')}${S.accounts.length > 1 ? ` · ${S.accounts.length} accounts` : ''}</div>
       <button class="icon-btn theme-btn" id="themeBtn">${icon('moon')}</button>`
    : `<div class="n" style="font-size:20px">SessionGram</div><div class="p">No account yet</div><button class="icon-btn theme-btn" id="themeBtn">${icon('moon')}</button>`;
  $('#themeBtn').onclick = () => { S.settings.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; saveSettings(); };
  const box = $('#drawerAccounts');
  const many = S.accounts.length > 6;
  if (many && !box.querySelector('.acc-filter')) {
    box.innerHTML = `<input class="acc-filter" placeholder="Search ${S.accounts.length} accounts" autocomplete="off"><div class="acc-list"></div>`;
    box.querySelector('.acc-filter').oninput = (e) => { S.accFilter = e.target.value.trim(); box.querySelector('.acc-list').innerHTML = accountRows() + ADD_ACCOUNT_ROW(); };
  } else if (!many) { box.innerHTML = '<div class="acc-list"></div>'; S.accFilter = ''; }
  if (many) box.querySelector('.acc-filter').placeholder = `Search ${S.accounts.length} accounts`;
  box.querySelector('.acc-list').innerHTML = accountRows() + ADD_ACCOUNT_ROW();
  box.onclick = (e) => {
    const r = e.target.closest('[data-acc]');
    if (r) { back(() => switchAccount(r.dataset.acc)); return; }
    if (e.target.closest('[data-act=add]')) back(openAddAccount);
  };
  const items = [
    ['profile', 'My Profile', openProfile], null,
    ['inbox', 'Unified Inbox', openInbox], ['group', 'New Group', () => openCreate('group')], ['channel', 'New Channel', () => openCreate('channel')], null,
    ['person', 'Contacts', openContacts], ['folder', 'Chat Folders', openFolders], ['bookmark', 'Saved Messages', () => openChat(a ? a.user_id : 'me')],
    ['archive', 'Archived Chats', openArchived], ['search', 'Find by username', () => openSearch()],
    ['settings', 'Settings', openSettings], null,
    ['refresh', 'Refresh chats', () => loadDialogs(S.aid, true)], ['group', 'All accounts', openAccountsManager],
    ['code', 'About the developer', openAbout],
  ];
  const free = new Set([openAccountsManager, openAbout, openInbox]);
  $('#drawerMenu').innerHTML = items.map((it, i) => it ? `<div class="menu-row" data-m="${i}">${icon(it[0])}<span>${it[1]}</span>${it[3] ? `<span class="badge muted">${it[3]}</span>` : ''}</div>` : '<div class="sep"></div>').join('');
  $('#drawerMenu').onclick = (e) => {
    const r = e.target.closest('[data-m]'); if (!r) return;
    const it = items[+r.dataset.m];
    if (!free.has(it[2]) && acc()?.status !== 'online') { back(() => toast('This account is not connected')); return; }
    back(it[2]);
  };
}

// ------------------------------------------------------------------ text formatting
function safeUrl(u) {
  u = String(u || '').trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
  return /^(https?|tg|mailto):/i.test(u) ? u : '#';
}
function fmtText(text, ents) {
  if (!text) return '';
  ents = (ents || []).slice().sort((a, b) => a.o - b.o || b.l - a.l);
  let out = '', pos = 0;
  for (const e of ents) {
    if (e.o < pos) continue;
    out += esc(text.slice(pos, e.o));
    const seg = text.slice(e.o, e.o + e.l), s = esc(seg);
    switch (e.t) {
      case 'bold': out += `<b>${s}</b>`; break;
      case 'italic': out += `<i>${s}</i>`; break;
      case 'underline': out += `<u>${s}</u>`; break;
      case 'strike': out += `<s>${s}</s>`; break;
      case 'code': out += `<code>${s}</code>`; break;
      case 'pre': out += `<pre>${s}</pre>`; break;
      case 'spoiler': out += `<span class="spoiler">${s}</span>`; break;
      case 'blockquote': out += `<blockquote>${s}</blockquote>`; break;
      case 'url': out += `<a href="${esc(safeUrl(seg))}" target="_blank" rel="noopener">${s}</a>`; break;
      case 'texturl': out += `<a href="${esc(safeUrl(e.url))}" target="_blank" rel="noopener">${s}</a>`; break;
      case 'mention': out += `<a href="#" data-mention="${esc(seg.replace(/^@/, ''))}">${s}</a>`; break;
      case 'hashtag': out += `<a href="#" data-hashtag="${s}">${s}</a>`; break;
      default: out += s;
    }
    pos = e.o + e.l;
  }
  return out + esc(text.slice(pos));
}
function tmeTarget(href) {
  const m = String(href).match(/^https?:\/\/(?:t|telegram)\.me\/(.+)$/i);
  if (!m) return null;
  const p = m[1].split(/[?#]/)[0];
  if (/^(\+|joinchat\/)/.test(p)) return { invite: href };
  const u = p.split('/')[0];
  return /^[A-Za-z0-9_]{4,}$/.test(u) ? { username: u } : null;
}
async function openUsername(u) {
  try { const info = await api(A(`/peer/${encodeURIComponent(u)}`)); openChat(info.id, info); }
  catch (e) { toast(e.message.includes('No user') || e.message.includes('Cannot find') ? `@${u} not found` : e.message); }
}

// ------------------------------------------------------------------ join
async function joinChat(aid, peer, username) {
  const r = await api(A('/join', aid), { json: { peer: String(peer), username: username || '' } });
  if (r.dialog) { upsertDialog(aid, r.dialog); if (aid === S.aid) scheduleRender(); }
  return r;
}

// ------------------------------------------------------------------ chat
function openChat(pid, peerInfo) {
  if (acc()?.status !== 'online') return toast('Account is not connected');
  pid = String(pid);
  const aid = S.aid;
  const d = findDialog(pid) || peerInfo || { id: pid, name: 'Loading…', kind: 'user' };
  const isSelf = d.is_self || (acc() && String(acc().user_id) === pid);
  const head = `<div class="bar-chat">${avatar(aid, pid, d.name, d.has_photo, 'sm', isSelf)}
     <div class="bar-title" style="padding-left:0"><span class="c-name">${esc(isSelf ? 'Saved Messages' : d.name)}</span><small class="c-sub"></small></div></div>`;
  const el = openPage({ head, actions: `<button class="icon-btn c-more">${icon('more')}</button>`, onClose: () => { if (S.chat && S.chat.el === el) S.chat = S.chatStack.pop() || null; } });
  el.querySelector('.page-body').remove();
  const pinBar = h(`<div class="pinned-bar hidden"><div class="pb"><b>Pinned message</b><span></span></div><button class="icon-btn pb-x">${icon('close')}</button></div>`);
  el.appendChild(pinBar);
  const body = h(`<div class="chat-body"><div class="msgs scroll"></div><button class="down-btn hidden">${icon('down')}</button></div>`);
  el.appendChild(body);
  const bottom = h(`<div></div>`); el.appendChild(bottom);
  S.chatStack = S.chatStack || [];
  if (S.chat) S.chatStack.push(S.chat);
  const C = S.chat = { aid, id: pid, el, msgsEl: body.querySelector('.msgs'), bottom, list: [], byId: new Map(), done: false, loading: false,
    kind: d.kind, info: null, replyTo: null, readOutbox: d.read_outbox || 0, unreadBelow: 0, isSelf, pinBar, pinned: null };
  pinBar.onclick = (e) => {
    if (e.target.closest('.pb-x')) { e.stopPropagation(); unpinMessage(C, C.pinned && C.pinned.id); return; }
    if (C.pinned) gotoMessage(C, C.pinned.id);
  };
  loadPinned(C);
  el.querySelector('.bar-chat').onclick = () => openInfo(pid, C.info);
  el.querySelector('.c-more').onclick = () => chatMenu(C);
  const down = body.querySelector('.down-btn');
  down.onclick = () => { C.msgsEl.scrollTop = C.msgsEl.scrollHeight; };
  C.msgsEl.addEventListener('scroll', () => {
    const nearBottom = C.msgsEl.scrollHeight - C.msgsEl.scrollTop - C.msgsEl.clientHeight < 200;
    down.classList.toggle('hidden', nearBottom);
    if (nearBottom && C.unreadBelow) { C.unreadBelow = 0; down.innerHTML = icon('down'); }
    if (C.msgsEl.scrollTop < 300) loadOlder(C);
  });
  C.msgsEl.addEventListener('click', (e) => bubbleClick(C, e));
  renderComposer(C, { can_send: d.kind !== 'channel', joined: true });
  loadOlder(C).then(() => { if ((findDialog(pid)?.unread || 0) > 0 || (findDialog(pid)?.mentions || 0) > 0) markRead(aid, pid); });
  api(A(`/peer/${encodeURIComponent(pid)}`, aid)).then((info) => {
    C.info = info; C.kind = info.kind;
    el.querySelector('.c-name').textContent = info.is_self ? 'Saved Messages' : info.name;
    el.querySelector('.c-sub').textContent = info.is_self ? '' : (info.status || '');
    if (!d.has_photo && info.has_photo) el.querySelector('.bar-chat .avatar').outerHTML = avatar(aid, pid, info.name, true, 'sm');
    renderComposer(C, info);
  }).catch((e) => toast(e.message));
}
function renderComposer(C, info) {
  const b = C.bottom;
  if (!info.joined && C.kind !== 'user' && C.kind !== 'bot') {
    b.innerHTML = `<div class="join-bar"><button>Join</button></div>`;
    b.querySelector('button').onclick = async () => {
      const btn = b.querySelector('button');
      btn.disabled = true; btn.textContent = 'Joining…';
      try {
        await joinChat(C.aid, C.id, info.username);
        toast(C.kind === 'channel' ? 'Joined channel' : 'Joined group');
        let fresh = { ...info, joined: true, can_send: C.kind !== 'channel' };
        try { fresh = await api(A(`/peer/${encodeURIComponent(C.id)}`, C.aid)); C.info = fresh; } catch { }
        renderComposer(C, { ...fresh, joined: true });
      } catch (e) { btn.disabled = false; btn.textContent = 'Join'; toast(e.message); }
    };
    return;
  }
  if (info.can_send === false) {
    const d = findDialog(C.id, C.aid);
    b.innerHTML = `<div class="join-bar"><button>${d && d.muted ? 'Unmute' : 'Mute'}</button></div>`;
    b.querySelector('button').onclick = async () => { const dd = findDialog(C.id, C.aid); await setMute(C.id, !(dd && dd.muted)); renderComposer(C, info); };
    return;
  }
  if (b.querySelector('textarea')) return;
  b.innerHTML = `<div class="reply-bar hidden">${icon('reply')}<div class="rb"><b></b><span></span></div><button class="icon-btn rb-x">${icon('close')}</button></div>
    <div class="composer"><button class="icon-btn att" aria-label="Attach">${icon('attach')}</button><textarea rows="1" placeholder="Message"></textarea>
    <button class="icon-btn mic" aria-label="Record voice message">${icon('mic')}</button>
    <button class="icon-btn send hidden" aria-label="Send">${icon('send')}</button><input type="file" class="hidden" multiple></div>`;
  const ta = b.querySelector('textarea'), file = b.querySelector('input[type=file]');
  const sendBtn = b.querySelector('.send'), mic = b.querySelector('.mic');
  const draftKey = `draft_${C.aid}_${C.id}`;
  ta.value = store.get(draftKey, '');
  const grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'; };
  const swap = () => { const has = !!ta.value.trim(); sendBtn.classList.toggle('hidden', !has); mic.classList.toggle('hidden', has || !window.MediaRecorder); };
  let lastTyping = 0;
  ta.oninput = () => {
    grow(); swap(); store.set(draftKey, ta.value);
    // Tell the other side we're typing, at most every 5 seconds (like Telegram does).
    if (S.settings.typing && ta.value && Date.now() - lastTyping > 5000) { lastTyping = Date.now(); api(A('/typing', C.aid), { json: { peer: C.id } }).catch(() => { }); }
  };
  setTimeout(() => { grow(); swap(); }, 0);
  ta.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey && !isTouch) { e.preventDefault(); sendText(C, ta); } };
  sendBtn.onclick = () => { if (wasLong(sendBtn)) return; sendText(C, ta); ta.focus(); };
  onLongPress(sendBtn, () => sendOptions(C, ta));
  mic.onclick = () => toggleRecording(C, b);
  b.querySelector('.att').onclick = () => file.click();
  b.querySelector('.rb-x').onclick = () => setReply(C, null);
  file.onchange = async () => {
    const files = Array.from(file.files); file.value = '';
    for (const f of files) {
      const fd = new FormData();
      fd.append('peer', C.id); fd.append('caption', files.length === 1 ? ta.value : ''); fd.append('reply_to', C.replyTo ? C.replyTo.id : 0); fd.append('file', f);
      toast(`Uploading ${f.name}…`);
      try { const r = await api(A('/send_file', C.aid), { method: 'POST', body: fd }); if (r.message) addMessages(C, [r.message], 'append'); if (files.length === 1) { ta.value = ''; store.set(draftKey, ''); grow(); swap(); } setReply(C, null); toast('Sent'); }
      catch (e) { toast(e.message); }
    }
  };
  C.swapSend = swap;
}
// Long-press the send button: send without sound, or schedule for later.
function sendOptions(C, ta) {
  if (!ta.value.trim()) return;
  sheet('Send options', [
    { icon: 'silent', label: 'Send without sound', fn: () => sendText(C, ta, { silent: true }) },
    { icon: 'clock', label: 'Schedule message', fn: () => scheduleText(C, ta) },
  ]);
}
function scheduleText(C, ta) {
  const pad = (n) => String(n).padStart(2, '0');
  const t = new Date(Date.now() + 60 * 60 * 1000);
  const val = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
  const f = openPage({ title: 'Schedule message', plain: true, body: `<div class="form">
      <label class="field"><span>Send on</span><input type="datetime-local" class="when" value="${val}"></label>
      <div class="btn-row" style="padding:0;flex-wrap:wrap">${[['In 1 hour', 60], ['Tonight 9 PM', 'night'], ['Tomorrow 9 AM', 'morning']].map(([l, v]) => `<button class="btn ghost" style="flex:1 1 30%;padding:10px 6px;font-size:14px" data-q="${v}">${l}</button>`).join('')}</div>
      <div class="err"></div><button class="btn grad go" style="width:100%;margin-top:16px">Schedule</button>
      <div class="hint" style="padding:12px 0 0">Telegram sends it at that time even if this phone is off.</div></div>` });
  const when = f.querySelector('.when');
  f.querySelector('.form').addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]'); if (!q) return;
    const d = new Date();
    if (q.dataset.q === 'night') { d.setHours(21, 0, 0, 0); if (d < new Date()) d.setDate(d.getDate() + 1); }
    else if (q.dataset.q === 'morning') { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); }
    else d.setTime(Date.now() + 60 * 60 * 1000);
    when.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  f.querySelector('.go').onclick = async () => {
    const at = Math.floor(new Date(when.value).getTime() / 1000);
    if (!at || at < Date.now() / 1000 + 60) { f.querySelector('.err').textContent = 'Pick a time at least a minute from now'; return; }
    back(() => sendText(C, ta, { schedule: at }));
  };
}
// Voice messages: tap the mic to record, tap again to send, X to cancel.
async function toggleRecording(C, b) {
  if (C.rec) { stopRecording(C, true); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch (e) { toast('Microphone permission is needed to record voice messages'); return; }
  const type = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported(t)) || '';
  const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  C.rec = { rec, stream, chunks, t0: Date.now(), type: rec.mimeType || type };
  rec.start(250);
  const mic = b.querySelector('.mic'), ta = b.querySelector('textarea');
  mic.classList.add('rec'); mic.innerHTML = icon('send');
  ta.classList.add('hidden'); b.querySelector('.att').classList.add('hidden');
  const bar = h(`<div class="rec-bar"><span class="dotr"></span><span class="rt">0:00</span><span style="flex:1"></span><button class="icon-btn rc-x" style="color:var(--text2)">${icon('delete')}</button></div>`);
  ta.after(bar);
  bar.querySelector('.rc-x').onclick = () => stopRecording(C, false);
  C.rec.timer = setInterval(() => { bar.querySelector('.rt').textContent = fmtDur((Date.now() - C.rec.t0) / 1000); }, 250);
  C.rec.typing = setInterval(() => api(A('/typing', C.aid), { json: { peer: C.id, voice: true } }).catch(() => { }), 5000);
  api(A('/typing', C.aid), { json: { peer: C.id, voice: true } }).catch(() => { });
}
function stopRecording(C, send) {
  const R = C.rec; if (!R) return;
  C.rec = null;
  clearInterval(R.timer); clearInterval(R.typing);
  const b = C.bottom, mic = b.querySelector('.mic');
  mic.classList.remove('rec'); mic.innerHTML = icon('mic');
  b.querySelector('textarea').classList.remove('hidden'); b.querySelector('.att').classList.remove('hidden');
  b.querySelector('.rec-bar')?.remove();
  R.rec.onstop = async () => {
    R.stream.getTracks().forEach((t) => t.stop());
    if (!send || Date.now() - R.t0 < 700) { if (send) toast('Hold on a bit longer to record'); return; }
    const ext = R.type.includes('ogg') ? 'ogg' : 'webm';
    const fd = new FormData();
    fd.append('peer', C.id); fd.append('voice', '1'); fd.append('reply_to', C.replyTo ? C.replyTo.id : 0);
    fd.append('file', new Blob(R.chunks, { type: R.type || 'audio/webm' }), `voice.${ext}`);
    toast('Sending voice message…');
    try { const r = await api(A('/send_file', C.aid), { method: 'POST', body: fd }); if (r.message) addMessages(C, [r.message], 'append'); setReply(C, null); C.msgsEl.scrollTop = C.msgsEl.scrollHeight; }
    catch (e) { toast(e.message); }
  };
  R.rec.stop();
}
function setReply(C, m) {
  C.replyTo = m;
  const rb = C.bottom.querySelector('.reply-bar'); if (!rb) return;
  rb.classList.toggle('hidden', !m);
  if (m) { rb.querySelector('b').textContent = m.out ? 'You' : (m.sender_name || 'Message'); rb.querySelector('span').textContent = m.text || (m.media ? m.media.kind : ''); C.bottom.querySelector('textarea').focus(); }
}
async function sendText(C, ta, opts = {}) {
  const text = ta.value.trim(); if (!text) return;
  const reply = C.replyTo;
  ta.value = ''; store.set(`draft_${C.aid}_${C.id}`, ''); ta.style.height = 'auto'; setReply(C, null); C.swapSend && C.swapSend();
  try {
    const r = await api(A('/send', C.aid), { json: { peer: C.id, text, reply_to: reply ? reply.id : null, silent: !!opts.silent, schedule: opts.schedule || null } });
    if (r.scheduled) { toast(`Scheduled for ${new Date(r.scheduled * 1000).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`); return; }
    if (opts.silent) toast('Sent without sound');
    if (!r.message) return;
    if (reply && !r.message.reply) r.message.reply = { id: reply.id, sender: reply.out ? 'You' : reply.sender_name, text: reply.text };
    addMessages(C, [r.message], 'append');
    C.msgsEl.scrollTop = C.msgsEl.scrollHeight;
  } catch (e) { ta.value = text; C.swapSend && C.swapSend(); toast(e.message); }
}
async function loadPinned(C) {
  try {
    const r = await api(A(`/pinned/${encodeURIComponent(C.id)}`, C.aid));
    C.pinned = r.message;
    C.pinBar.classList.toggle('hidden', !r.message);
    if (r.message) { C.pinBar.querySelector('b').textContent = r.count > 1 ? `Pinned message (${r.count})` : 'Pinned message'; C.pinBar.querySelector('span').textContent = r.message.text; }
  } catch { C.pinBar.classList.add('hidden'); }
}
async function pinMessage(C, m) {
  const notify = C.kind !== 'channel' && C.kind !== 'user' ? confirm('Notify all members about this pin?') : false;
  try { await api(A('/pin_message', C.aid), { json: { peer: C.id, id: m.id, notify } }); m.pinned = true; replaceMessage(C, m); loadPinned(C); toast('Message pinned'); }
  catch (e) { toast(e.message); }
}
async function unpinMessage(C, id) {
  if (!id) return;
  try { await api(A('/pin_message', C.aid), { json: { peer: C.id, id, unpin: true } }); const m = C.byId.get(id); if (m) { m.pinned = false; replaceMessage(C, m); } loadPinned(C); toast('Message unpinned'); }
  catch (e) { toast(e.message); }
}
function gotoMessage(C, id) {
  const m = C.byId.get(+id);
  if (m && m._el) { m._el.scrollIntoView({ block: 'center', behavior: 'smooth' }); m._el.classList.remove('flash'); void m._el.offsetWidth; m._el.classList.add('flash'); }
  else toast('That message is further up: scroll up to load it');
}
const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '😮', '😢', '🙏', '🎉'];
async function react(C, m, emoji) {
  const mine = (m.reactions || []).find((r) => r.me);
  const next = mine && mine.e === emoji ? '' : emoji;     // tapping your own reaction removes it
  try {
    const r = await api(A('/react', C.aid), { json: { peer: C.id, id: m.id, emoji: next } });
    m.reactions = r.reactions; replaceMessage(C, m);
    m._el && m._el.querySelector('.rx.me')?.classList.add('rx-pop');
  } catch (e) { toast(e.message.includes('REACTION_INVALID') ? 'This chat does not allow that reaction' : e.message); }
}
async function loadOlder(C) {
  if (C.loading || C.done) return;
  C.loading = true;
  const first = C.list[0];
  try {
    const r = await api(A(`/messages/${encodeURIComponent(C.id)}?limit=40&offset_id=${first ? first.id : 0}`, C.aid));
    if (r.messages.length < 40) C.done = true;
    addMessages(C, r.messages, first ? 'prepend' : 'initial');
  } catch (e) { toast(e.message); C.done = true; }
  C.loading = false;
}
function addMessages(C, msgs, mode) {
  msgs = msgs.filter((m) => !C.byId.has(m.id));
  if (!msgs.length) { if (mode === 'initial') C.msgsEl.innerHTML = '<div class="empty" style="margin:auto;color:#fff">No messages here yet…</div>'; return; }
  const el = C.msgsEl;
  if (mode === 'initial') el.innerHTML = '';
  if (mode === 'append') el.querySelector(':scope > .empty')?.remove();
  const frag = document.createDocumentFragment();
  let prev = mode === 'append' ? C.list[C.list.length - 1] : null;
  for (const m of msgs) {
    if (!prev || new Date(prev.date * 1000).toDateString() !== new Date(m.date * 1000).toDateString()) frag.appendChild(h(`<div class="day" data-day="${new Date(m.date * 1000).toDateString()}">${fmtDay(m.date)}</div>`));
    const node = msgEl(C, m, prev); m._el = node; frag.appendChild(node);
    C.byId.set(m.id, m); prev = m;
  }
  if (mode === 'prepend') {
    const oldH = el.scrollHeight, oldTop = el.scrollTop;
    const firstDay = el.querySelector('.day');
    const lastNew = msgs[msgs.length - 1];
    if (firstDay && firstDay.dataset.day === new Date(lastNew.date * 1000).toDateString()) firstDay.remove();
    el.insertBefore(frag, el.firstChild);
    C.list = msgs.concat(C.list);
    el.scrollTop = el.scrollHeight - oldH + oldTop;
  } else {
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 250;
    el.appendChild(frag);
    C.list = C.list.concat(msgs);
    if (mode === 'initial' || near) { el.scrollTop = el.scrollHeight; requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; }); }
    else if (mode === 'append' && msgs.some((m) => !m.out)) {
      C.unreadBelow += msgs.filter((m) => !m.out).length;
      const dn = C.el.querySelector('.down-btn'); dn.classList.remove('hidden'); dn.innerHTML = icon('down') + `<span class="badge">${C.unreadBelow}</span>`;
    }
  }
}
function mediaHtml(C, m) {
  const md = m.media; if (!md) return '';
  const base = A(`/media/${encodeURIComponent(C.id)}/${m.id}`, C.aid);
  const auto = S.settings.autoload;
  switch (md.kind) {
    case 'photo':
      return auto ? `<img class="media-img" loading="lazy" src="${base}" data-view="${base}" ${md.w ? `style="aspect-ratio:${md.w}/${md.h}"` : ''}>`
        : `<div class="filebox" data-loadimg="${base}"><div class="fi">${icon('download')}</div><div><div class="fn">Photo</div><div class="fs">Tap to load</div></div></div>`;
    case 'sticker':
      if (md.mime === 'video/webm') return `<video class="sticker" autoplay loop muted playsinline src="${base}"></video>`;
      if (md.animated) return `<div style="font-size:72px;line-height:1.1">${esc(md.alt || '🙂')}</div>`;
      return `<img class="media-img sticker" loading="lazy" src="${base}" alt="${esc(md.alt || '')}">`;
    case 'gif': return `<video class="media-img" autoplay loop muted playsinline preload="metadata" src="${base}"></video>`;
    case 'video': case 'video_note':
      return `<div style="position:relative;cursor:pointer" data-video="${base}"><img class="media-img" loading="lazy" src="${base}?thumb=1" ${md.w ? `style="aspect-ratio:${md.w}/${md.h}${md.kind === 'video_note' ? ';border-radius:50%;width:220px' : ''}"` : ''}>
        <div style="position:absolute;inset:0;display:grid;place-items:center;pointer-events:none"><div style="background:rgba(0,0,0,.5);border-radius:50%;width:52px;height:52px;display:grid;place-items:center;color:#fff">${icon('play')}</div></div>
        <span style="position:absolute;left:8px;top:8px;background:rgba(0,0,0,.5);color:#fff;font-size:12px;padding:1px 6px;border-radius:8px">${fmtDur(md.duration)}${md.size ? ' · ' + fmtSize(md.size) : ''}</span></div>`;
    case 'voice': case 'audio':
      return `${md.kind === 'audio' && md.name ? `<div class="fn" style="font-weight:500">${esc(md.name)}</div>` : ''}<audio controls preload="none" src="${base}"></audio>`;
    case 'document':
      return `<a class="filebox" href="${base}?download=1" target="_blank" style="color:inherit;text-decoration:none"><div class="fi">${icon('file')}</div><div style="min-width:0"><div class="fn">${esc(md.name || 'File')}</div><div class="fs">${fmtSize(md.size)} · ${esc(md.mime || '')}</div></div></a>`;
    case 'poll': {
      const tot = md.total || 0;
      return `<div class="poll"><div class="q">📊 ${esc(md.question)}</div>${md.answers.map((a) => { const p = tot ? Math.round(a.votes * 100 / tot) : 0; return `<div class="a">${p}% · ${esc(a.text)}<div class="bar2" style="width:${Math.max(p, 2)}%"></div></div>`; }).join('')}<div class="fs" style="color:var(--text2);font-size:13px">${tot} votes</div></div>`;
    }
    case 'location': return `<a href="https://maps.google.com/?q=${md.lat},${md.long}" target="_blank" rel="noopener">📍 Location (${(+md.lat).toFixed(4)}, ${(+md.long).toFixed(4)})</a>`;
    case 'contact': return `<div class="filebox" ${md.user_id ? `data-openpeer="${md.user_id}"` : ''}><div class="fi">${icon('person')}</div><div><div class="fn">${esc([md.first, md.last].filter(Boolean).join(' '))}</div><div class="fs">${esc(md.phone || '')}</div></div></div>`;
    case 'dice': return `<div style="font-size:56px">${esc(md.emoticon)}</div><div class="fs">Result: ${md.value}</div>`;
    case 'webpage':
      if (!md.url) return '';
      return `<a class="webpage" href="${esc(safeUrl(md.url))}" target="_blank" rel="noopener" style="display:block;color:inherit;text-decoration:none">${md.site ? `<b>${esc(md.site)}</b>` : ''}${md.title ? `<div style="font-weight:500">${esc(md.title)}</div>` : ''}${md.description ? `<div class="d">${esc(md.description)}</div>` : ''}${md.has_photo && auto ? `<img loading="lazy" src="${base}?thumb=1" onerror="this.remove()">` : ''}</a>`;
    default: return `<div class="fs">[${esc(md.kind)}]</div>`;
  }
}
function metaHtml(C, m) {
  const isChan = C.kind === 'channel';
  let s = '';
  if (m.edited) s += 'edited ';
  if (m.views != null && isChan) s += `<span class="views">${icon('eye')}${fmtNum(m.views)}</span> `;
  if (m.author && isChan) s += esc(m.author) + ', ';
  s += fmtClock(m.date);
  if (m.out && !isChan && !C.isSelf) s += m.id <= C.readOutbox ? icon('done_all') : icon('done');
  return `<span class="meta">${s}</span>`;
}
function msgEl(C, m, prev) {
  if (m.service) return h(`<div class="service" data-id="${m.id}">${esc(m.text)}</div>`);
  const isChan = C.kind === 'channel';
  const out = m.out && !isChan;
  const showSender = !out && !isChan && C.kind === 'group' && m.sender_name && !(prev && !prev.service && prev.sender_id === m.sender_id && m.date - prev.date < 300);
  const color = COLORS[Math.abs(Number(m.sender_id) || 0) % 8];
  const html = `<div class="bubble ${out ? 'out' : ''} ${isChan ? 'channel' : ''} ${m.pinned ? 'is-pinned' : ''}" data-id="${m.id}">
    ${showSender ? `<div class="sender" style="color:${color}" data-openpeer="${m.sender_id}">${esc(m.sender_name)}</div>` : ''}
    ${m.fwd ? `<div class="fwd">Forwarded from <b>${esc(m.fwd)}</b></div>` : ''}
    ${m.reply ? `<div class="reply" data-goto="${m.reply.id}"><b>${esc(m.reply.sender || 'Reply')}</b><span>${esc(m.reply.text || '')}</span></div>` : (m.reply_to ? `<div class="reply" data-goto="${m.reply_to}"><b>Reply</b><span>Original message</span></div>` : '')}
    ${m.media && m.media.kind !== 'webpage' ? mediaHtml(C, m) : ''}
    ${m.text ? `<div class="txt">${fmtText(m.text, m.entities)}${metaHtml(C, m)}</div>` : metaHtml(C, m)}
    ${m.media && m.media.kind === 'webpage' ? mediaHtml(C, m) : ''}
    <div style="clear:both"></div>${reactionsHtml(m)}</div>`;
  const node = h(html);
  onLongPress(node, () => msgMenu(C, m));
  return node;
}
function reactionsHtml(m) {
  if (!m.reactions || !m.reactions.length) return '';
  return `<div class="reactions">${m.reactions.map((r) => `<span class="rx ${r.me ? 'me' : ''}" data-rx="${esc(r.e)}">${esc(r.e)} ${fmtNum(r.n)}</span>`).join('')}</div>`;
}
function bubbleClick(C, e) {
  const t = e.target;
  const rx = t.closest('[data-rx]');
  if (rx) { const m = C.byId.get(+rx.closest('.bubble').dataset.id); if (m) react(C, m, rx.dataset.rx); return; }
  const a = t.closest('a');
  if (a) {
    if (a.dataset.mention) { e.preventDefault(); openUsername(a.dataset.mention); return; }
    if (a.dataset.hashtag) { e.preventDefault(); return; }
    const tm = tmeTarget(a.href);
    if (tm) {
      e.preventDefault();
      if (tm.username) openUsername(tm.username);
      else if (confirm('Join this chat via invite link?')) joinChat(C.aid, tm.invite).then((r) => { toast('Joined'); openChat(r.id, r.dialog); }).catch((er) => toast(er.message));
    }
    return;
  }
  if (t.classList.contains('spoiler')) { t.classList.add('show'); return; }
  const v = t.closest('[data-view]'); if (v) { viewer(`<img src="${v.dataset.view}">`); return; }
  const vid = t.closest('[data-video]'); if (vid) { viewer(`<video src="${vid.dataset.video}" controls autoplay playsinline></video>`); return; }
  const li = t.closest('[data-loadimg]'); if (li) { li.outerHTML = `<img class="media-img" src="${li.dataset.loadimg}" data-view="${li.dataset.loadimg}">`; return; }
  const g = t.closest('[data-goto]'); if (g) { gotoMessage(C, g.dataset.goto); return; }
  const op = t.closest('[data-openpeer]'); if (op) { openInfo(op.dataset.openpeer); return; }
  if (t.closest('audio,video')) return;
  const b = t.closest('.bubble');
  if (b && !wasLong(b) && (isTouch || e.detail === 1)) { const m = C.byId.get(+b.dataset.id); if (m && isTouch) msgMenu(C, m); }
}
function msgMenu(C, m) {
  const canWrite = C.bottom.querySelector('textarea');
  const info = C.info || {};
  const canPin = C.kind === 'user' || C.isSelf || info.can_pin !== false;
  sheet(null, [
    canWrite && { icon: 'reply', label: 'Reply', fn: () => setReply(C, m) },
    m.text && { icon: 'copy', label: 'Copy text', fn: () => copyText(m.text) },
    info.username && { icon: 'link', label: 'Copy message link', fn: () => copyText(`https://t.me/${info.username}/${m.id}`) },
    { icon: 'forward', label: 'Forward', fn: () => pickChat('Forward to…', (pid) => forwardMsg(C, m, pid)) },
    !C.isSelf && { icon: 'bookmark', label: 'Save to Saved Messages', fn: () => forwardMsg(C, m, 'me', 'Saved to Saved Messages') },
    canPin && { icon: 'pin', label: m.pinned ? 'Unpin' : 'Pin', fn: () => (m.pinned ? unpinMessage(C, m.id) : pinMessage(C, m)) },
    m.out && m.text && !m.media?.kind?.match(/poll/) && { icon: 'edit', label: 'Edit', fn: () => editMsg(C, m) },
    { icon: 'delete', label: 'Delete', red: true, fn: () => deleteMsg(C, m) },
  ], C.kind !== 'channel' || C.info?.joined ? (emoji) => react(C, m, emoji) : null);
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast('Copied'); }
  catch { const ta = h('<textarea style="position:fixed;opacity:0"></textarea>'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Copied'); }
}
async function forwardMsg(C, m, pid, done = 'Forwarded') {
  try { await api(A('/forward', C.aid), { json: { from_peer: C.id, to_peer: pid, ids: [m.id] } }); toast(done); } catch (e) { toast(e.message); }
}
async function editMsg(C, m) {
  const t = prompt('Edit message', m.text); if (t == null || !t.trim() || t === m.text) return;
  try { const r = await api(A('/edit', C.aid), { json: { peer: C.id, id: m.id, text: t } }); if (r.message) replaceMessage(C, r.message); } catch (e) { toast(e.message); }
}
async function deleteMsg(C, m) {
  const both = m.out || C.kind === 'user' ? confirm('Delete for everyone?\nOK = for everyone, Cancel = only for me') : false;
  if (!both && !confirm('Delete this message for you?')) return;
  try { await api(A('/delete', C.aid), { json: { peer: C.id, ids: [m.id], revoke: both } }); removeMessages(C, [m.id]); } catch (e) { toast(e.message); }
}
function replaceMessage(C, m) {
  const old = C.byId.get(m.id); if (!old) return;
  if (!m.reply && old.reply) m.reply = old.reply;
  const i = C.list.indexOf(old);
  const node = msgEl(C, m, C.list[i - 1]);
  old._el.replaceWith(node); m._el = node; C.byId.set(m.id, m); C.list[i] = m;
}
function removeMessages(C, ids) {
  for (const id of ids) { const m = C.byId.get(id); if (!m) continue; m._el.remove(); C.byId.delete(id); C.list = C.list.filter((x) => x.id !== id); }
}
function updateTicks(C) {
  C.list.forEach((m) => { if (m.out && !m.service && m._el) { const meta = m._el.querySelector('.meta'); if (meta) meta.outerHTML = metaHtml(C, m); } });
}
function chatMenu(C) {
  const d = findDialog(C.id, C.aid);
  sheet(null, [
    { icon: 'info', label: 'View info', fn: () => openInfo(C.id, C.info) },
    { icon: 'search', label: 'Search messages', fn: () => openChatSearch(C) },
    d && { icon: d.muted ? 'bell' : 'mute', label: d.muted ? 'Unmute' : 'Mute', fn: () => setMute(C.id, !d.muted) },
    { icon: 'refresh', label: 'Reload messages', fn: () => { C.list = []; C.byId.clear(); C.done = false; C.msgsEl.innerHTML = ''; loadOlder(C); } },
    !C.isSelf && { icon: 'delete', label: C.kind === 'user' || C.kind === 'bot' ? 'Delete chat' : 'Leave', red: true, fn: () => leaveChat(C.id) },
  ]);
}
function openChatSearch(C) {
  const el = openPage({ head: `<input class="search-in" placeholder="Search in chat">`, plain: true });
  const inp = el.querySelector('.search-in'), body = el.querySelector('.page-body');
  setTimeout(() => inp.focus(), 250);
  const run = debounce(async () => {
    const q = inp.value.trim(); if (!q) { body.innerHTML = ''; return; }
    try {
      const r = await api(A(`/search_messages/${encodeURIComponent(C.id)}?q=${encodeURIComponent(q)}`, C.aid));
      body.innerHTML = r.messages.map((m) => `<div class="row" data-mid="${m.id}" style="min-height:60px"><div class="body"><div class="l1"><span class="name">${esc(m.out ? 'You' : (m.sender_name || ''))}</span><span class="time">${fmtTime(m.date)}</span></div><div class="l2"><span class="msg">${esc(m.text || (m.media && m.media.kind) || '')}</span></div></div></div>`).join('') || '<div class="empty">No results</div>';
    } catch (e) { toast(e.message); }
  }, 350);
  inp.oninput = run;
  body.onclick = (e) => {
    const r = e.target.closest('[data-mid]'); if (!r) return;
    const id = +r.dataset.mid;
    back(() => { const m = C.byId.get(id); if (m) { m._el.scrollIntoView({ block: 'center' }); m._el.classList.add('flash'); } else toast('Older message: scroll up to load it'); });
  };
}
let readT;
function markReadSoon() {
  const C = S.chat; if (!C || document.hidden) return;
  clearTimeout(readT); readT = setTimeout(() => markRead(C.aid, C.id), 600);
}

// ------------------------------------------------------------------ info / profile pages
async function openInfo(pid, info) {
  const aid = S.aid;
  const el = openPage({ title: 'Info', plain: true });
  const body = el.querySelector('.page-body');
  body.innerHTML = '<div class="empty">Loading…</div>';
  try { if (!info || info.about === undefined) info = await api(A(`/peer/${encodeURIComponent(pid)}`, aid)); }
  catch (e) { body.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  const rows = [];
  if (info.phone) rows.push([info.phone, 'Mobile']);
  if (info.about) rows.push([info.about, info.kind === 'user' || info.kind === 'bot' ? 'Bio' : 'Description']);
  if (info.username) rows.push([`<a href="#" data-copy="@${esc(info.username)}">@${esc(info.username)}</a>`, 'Username', true]);
  if (info.link) rows.push([`<a href="${esc(info.link)}" target="_blank" rel="noopener">${esc(info.link)}</a>`, 'Link', true]);
  rows.push([String(info.id), 'ID']);
  const inChat = S.chat && String(S.chat.id) === String(info.id);
  body.innerHTML = `<div class="profile-head">${avatar(aid, info.id, info.name, info.has_photo, 'xl', info.is_self)}
      <div style="min-width:0"><div class="n">${esc(info.name)}${info.verified ? ' ' + icon('verified').replace('<svg', '<svg class="verified"') : ''}</div><div class="s">${esc(info.status || '')}</div></div></div>
    <div class="btn-row">${!inChat ? `<button class="btn" data-a="msg">${info.kind === 'channel' ? 'Open channel' : 'Message'}</button>` : ''}
      ${!info.joined ? '<button class="btn" data-a="join">Join</button>' : ''}
      ${findDialog(info.id, aid) ? `<button class="btn ghost" data-a="mute">${info.muted ? 'Unmute' : 'Mute'}</button>` : ''}</div>
    <div class="card" style="margin-top:0;background:var(--bg)">${rows.map((r) => `<div class="info-row"><div class="v">${r[2] ? r[0] : esc(r[0])}</div><div class="k">${r[1]}</div></div>`).join('')}</div>
    ${info.joined && info.kind !== 'user' && info.kind !== 'bot' && !info.is_self ? `<div class="btn-row"><button class="btn danger" data-a="leave">Leave ${info.kind}</button></div>` : ''}`;
  body.onclick = async (e) => {
    const c = e.target.closest('[data-copy]'); if (c) { e.preventDefault(); copyText(c.dataset.copy); return; }
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'msg') openChat(info.id, info);
    if (a === 'join') { b.disabled = true; b.textContent = 'Joining…'; try { await joinChat(aid, info.id, info.username); info.joined = true; toast('Joined'); b.remove(); } catch (er) { b.disabled = false; b.textContent = 'Join'; toast(er.message); } }
    if (a === 'mute') { await setMute(info.id, !info.muted); info.muted = !info.muted; b.textContent = info.muted ? 'Unmute' : 'Mute'; }
    if (a === 'leave') leaveChat(info.id);
  };
  const av = body.querySelector('.profile-head .avatar img');
  if (av) av.onclick = () => viewer(`<img src="${av.src}">`);
}

async function openProfile() {
  const aid = S.aid;
  const el = openPage({ title: 'My Profile', actions: `<button class="icon-btn p-edit">${icon('edit')}</button>`, plain: true });
  const body = el.querySelector('.page-body');
  body.innerHTML = '<div class="empty">Loading…</div>';
  let me;
  const draw = () => {
    body.innerHTML = `<div class="profile-head"><div style="position:relative" class="p-ph">${avatar(aid, 'me', me.name, me.has_photo, 'xl')}
        <span style="position:absolute;right:-2px;bottom:-2px;background:var(--accent);color:#fff;border-radius:50%;width:32px;height:32px;display:grid;place-items:center;border:2px solid var(--bar)">${icon('camera').replace('<svg', '<svg style="width:18px;height:18px"')}</span></div>
      <div style="min-width:0"><div class="n">${esc(me.name)}${me.premium ? ' ⭐' : ''}</div><div class="s">online</div></div></div>
      <div class="section-title">Account</div>
      <div class="info-row"><div class="v">${esc(me.phone || '')}</div><div class="k">Tap to copy phone number</div></div>
      <div class="info-row"><div class="v">${me.username ? '@' + esc(me.username) : 'None'}</div><div class="k">Username</div></div>
      <div class="info-row"><div class="v">${esc(me.about || 'Bio')}</div><div class="k">Bio</div></div>
      <div class="info-row"><div class="v">${me.id}</div><div class="k">User ID</div></div>
      <input type="file" accept="image/*" class="hidden p-file">`;
    body.querySelectorAll('.info-row')[0].onclick = () => copyText(me.phone);
    body.querySelector('.p-ph').onclick = () => body.querySelector('.p-file').click();
    body.querySelector('.p-file').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const fd = new FormData(); fd.append('file', f); toast('Uploading photo…');
      try { await api(A('/photo', aid), { method: 'POST', body: fd }); toast('Profile photo updated'); me.has_photo = true; draw(); body.querySelectorAll('img').forEach((i) => { i.src = i.src.split('?')[0] + '?t=' + Date.now(); }); }
      catch (er) { toast(er.message); }
    };
  };
  try { me = await api(A('/me', aid)); draw(); } catch (e) { body.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  el.querySelector('.p-edit').onclick = () => {
    const f = openPage({ title: 'Edit Profile', actions: `<button class="icon-btn f-save">${icon('done')}</button>`, plain: true,
      body: `<div class="form"><label class="field"><span>First name</span><input name="first_name"></label><label class="field"><span>Last name</span><input name="last_name"></label>
        <label class="field"><span>Bio</span><textarea name="about" rows="3" maxlength="140"></textarea></label><label class="field"><span>Username</span><input name="username" placeholder="(none)"></label>
        <div class="hint" style="padding:0">Username can contain a–z, 0–9 and underscores, minimum 5 characters.</div><div class="err"></div></div>` });
    ['first_name', 'last_name', 'about', 'username'].forEach((k) => { f.querySelector(`[name=${k}]`).value = me[k] || ''; });
    f.querySelector('.f-save').onclick = async () => {
      const data = {}; ['first_name', 'last_name', 'about', 'username'].forEach((k) => { data[k] = f.querySelector(`[name=${k}]`).value.trim(); });
      try { me = await api(A('/me', aid), { json: data }); draw(); const a = acc(aid); if (a) { a.name = me.name; a.username = me.username; } scheduleDrawer(); renderMainHead(); back(); toast('Saved'); }
      catch (e) { f.querySelector('.err').textContent = e.message; }
    };
  };
}

// ------------------------------------------------------------------ search
function openSearch() {
  if (acc()?.status !== 'online') return toast('Account is not connected');
  const aid = S.aid;
  const el = openPage({ head: `<input class="search-in" placeholder="Search chats, @username or t.me link" autocomplete="off" autocapitalize="off">`, plain: true });
  const inp = el.querySelector('.search-in'), body = el.querySelector('.page-body');
  setTimeout(() => inp.focus(), 250);
  const recent = store.get('recent_' + aid, []);
  const showRecent = () => {
    body.innerHTML = recent.length ? `<div class="section-title">Recent</div>` + recent.map((p) => peerRow(aid, p)).join('') : `<div class="empty">Search by name, @username, or paste a t.me link.<br>Results from all of Telegram appear under "Global search".</div>`;
  };
  showRecent();
  let seq = 0;
  const run = debounce(async () => {
    let q = inp.value.trim();
    const tm = tmeTarget(q.startsWith('http') ? q : (q.startsWith('t.me/') ? 'https://' + q : ''));
    if (tm && tm.username) q = tm.username;
    if (!q) return showRecent();
    const my = ++seq;
    const ql = q.toLowerCase().replace(/^@/, '');
    const local = (dialogsOf(aid) || []).filter((d) => d.name.toLowerCase().includes(ql) || (d.username || '').toLowerCase().includes(ql)).slice(0, 20);
    body.innerHTML = (local.length ? `<div class="section-title">Chats</div>${local.map((d) => peerRow(aid, d)).join('')}` : '') + `<div class="section-title">Global search</div><div class="empty g-wait">Searching…</div>`;
    if (tm && tm.invite) { body.innerHTML = `<div class="btn-row"><button class="btn" data-join="${esc(tm.invite)}">Join via invite link</button></div>`; return; }
    try {
      const r = await api(A(`/search?q=${encodeURIComponent(q)}`, aid));
      if (my !== seq) return;
      const localIds = new Set(local.map((d) => String(d.id)));
      const glob = r.global.filter((p) => !localIds.has(String(p.id)));
      body.innerHTML = (local.length ? `<div class="section-title">Chats</div>${local.map((d) => peerRow(aid, d)).join('')}` : '') +
        `<div class="section-title">Global search</div>` + (glob.map((p) => peerRow(aid, p, true)).join('') || '<div class="empty">No global results</div>');
    } catch (e) { if (my === seq) body.querySelector('.g-wait').textContent = e.message; }
  }, 400);
  inp.oninput = run;
  inp.onkeydown = (e) => { if (e.key === 'Enter') run(); };
  body.onclick = async (e) => {
    const j = e.target.closest('[data-join]');
    if (j) { j.disabled = true; j.textContent = 'Joining…'; try { const r = await joinChat(aid, j.dataset.join); toast('Joined'); openChat(r.id, r.dialog); } catch (er) { j.disabled = false; j.textContent = 'Join via invite link'; toast(er.message); } return; }
    const r = e.target.closest('[data-pick]'); if (!r) return;
    const p = JSON.parse(decodeURIComponent(r.dataset.pick));
    const i = recent.findIndex((x) => String(x.id) === String(p.id)); if (i >= 0) recent.splice(i, 1);
    recent.unshift(p); recent.length = Math.min(recent.length, 15); store.set('recent_' + aid, recent);
    openChat(p.id, p);
  };
}
function peerRow(aid, p, global) {
  const slim = { id: p.id, name: p.name, kind: p.kind, username: p.username, has_photo: p.has_photo, is_self: p.is_self, verified: p.verified };
  const sub = p.username ? '@' + p.username + (p.participants ? ` · ${fmtNum(p.participants)} ${p.kind === 'channel' ? 'subscribers' : 'members'}` : '') : (p.kind === 'channel' ? 'channel' : p.kind === 'group' ? 'group' : p.phone || '');
  return `<div class="row" data-pick="${encodeURIComponent(JSON.stringify(slim))}" style="min-height:64px">${avatar(aid, p.id, p.name, p.has_photo, 'sm', p.is_self)}
    <div class="body"><div class="l1"><span class="name">${esc(p.name)}</span>${p.verified ? icon('verified').replace('<svg', '<svg class="verified"') : ''}</div><div class="l2"><span class="sub">${esc(sub)}</span></div></div></div>`;
}
function pickChat(title, cb) {
  const aid = S.aid;
  const el = openPage({ head: `<input class="search-in" placeholder="${esc(title)}">`, plain: true });
  const inp = el.querySelector('.search-in'), body = el.querySelector('.page-body');
  const draw = () => {
    const q = inp.value.trim().toLowerCase();
    body.innerHTML = sortDialogs((dialogsOf(aid) || []).filter((d) => !q || d.name.toLowerCase().includes(q))).slice(0, 200).map((d) => peerRow(aid, d)).join('');
  };
  draw(); inp.oninput = draw;
  body.onclick = (e) => { const r = e.target.closest('[data-pick]'); if (!r) return; const p = JSON.parse(decodeURIComponent(r.dataset.pick)); back(() => cb(p.id)); };
}

// ------------------------------------------------------------------ contacts / create / folders / devices
async function openContacts() {
  const aid = S.aid;
  const el = openPage({ title: 'Contacts', actions: `<button class="icon-btn c-add">${icon('add')}</button>`, plain: true });
  const body = el.querySelector('.page-body');
  body.innerHTML = '<div class="empty">Loading…</div>';
  let list = [];
  try { list = (await api(A('/contacts', aid))).contacts; } catch (e) { body.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  body.innerHTML = `<div style="padding:8px 14px"><input class="c-filter" placeholder="Search contacts" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--bg2);outline:none"></div><div class="c-list"></div>`;
  const draw = () => {
    const q = body.querySelector('.c-filter').value.trim().toLowerCase();
    body.querySelector('.c-list').innerHTML = list.filter((c) => !q || c.name.toLowerCase().includes(q) || (c.username || '').toLowerCase().includes(q) || (c.phone || '').includes(q))
      .map((c) => peerRow(aid, { ...c, phone: c.phone })).join('') || `<div class="empty">No contacts</div>`;
  };
  draw();
  body.querySelector('.c-filter').oninput = draw;
  body.onclick = (e) => { const r = e.target.closest('[data-pick]'); if (r) { const p = JSON.parse(decodeURIComponent(r.dataset.pick)); openChat(p.id, p); } };
  el.querySelector('.c-add').onclick = () => {
    const f = openPage({ title: 'New Contact', actions: `<button class="icon-btn f-save">${icon('done')}</button>`, plain: true,
      body: `<div class="form"><label class="field"><span>Phone number (with country code)</span><input name="phone" type="tel" placeholder="+1 234 567 8900"></label>
      <label class="field"><span>First name</span><input name="first_name"></label><label class="field"><span>Last name</span><input name="last_name"></label><div class="err"></div></div>` });
    f.querySelector('.f-save').onclick = async () => {
      const data = {}; ['phone', 'first_name', 'last_name'].forEach((k) => { data[k] = f.querySelector(`[name=${k}]`).value.trim(); });
      try { const r = await api(A('/contacts', aid), { json: data }); back(() => openChat(r.id)); } catch (e) { f.querySelector('.err').textContent = e.message; }
    };
  };
}
function openCreate(kind) {
  const aid = S.aid;
  const f = openPage({ title: kind === 'group' ? 'New Group' : 'New Channel', actions: `<button class="icon-btn f-save">${icon('done')}</button>`, plain: true,
    body: `<div class="form"><label class="field"><span>${kind === 'group' ? 'Group' : 'Channel'} name</span><input name="title"></label>
      <label class="field"><span>Description (optional)</span><textarea name="about" rows="3"></textarea></label>
      <div class="hint" style="padding:0">${kind === 'group' ? 'Creates a supergroup. Add members from the official app or share the invite link.' : 'Creates a broadcast channel owned by this account.'}</div><div class="err"></div></div>` });
  f.querySelector('.f-save').onclick = async () => {
    const title = f.querySelector('[name=title]').value.trim(); if (!title) return;
    try { const r = await api(A('/create', aid), { json: { kind, title, about: f.querySelector('[name=about]').value } }); toast('Created'); setTimeout(() => loadDialogs(aid), 1500); back(() => openChat(r.id, { id: r.id, name: title, kind })); }
    catch (e) { f.querySelector('.err').textContent = e.message; }
  };
}
function openFolders() {
  const f = S.folders[S.aid] || [];
  const ds = dialogsOf() || [];
  const el = openPage({ title: 'Chat Folders', body: `<div class="card">
      <div class="set-row" data-f="all"><div class="ico" style="background:#3d9ae8">${icon('chat')}</div><div class="t"><div>All Chats</div><div>${ds.filter((d) => !d.archived).length} chats</div></div></div>
      ${f.map((x) => `<div class="set-row" data-f="${x.id}"><div class="ico" style="background:#1ea5e9">${icon('folder')}</div><div class="t"><div>${esc(x.title)}</div><div>${ds.filter((d) => (d.folders || []).includes(x.id)).length} chats</div></div></div>`).join('')}
    </div><div class="hint">Folders are synced from your Telegram account. Create or edit them in any official Telegram app and they appear here as tabs.</div>` });
  el.querySelector('.page-body').onclick = (e) => {
    const r = e.target.closest('[data-f]'); if (!r) return;
    S.folder = r.dataset.f === 'all' ? 'all' : +r.dataset.f; store.set('folder', S.folder); closeAll(renderMain);
  };
}
async function openDevices() {
  const aid = S.aid;
  const el = openPage({ title: 'Devices' });
  const body = el.querySelector('.page-body');
  body.innerHTML = '<div class="empty">Loading…</div>';
  try {
    const r = await api(A('/devices', aid));
    const row = (d) => `<div class="set-row" ${d.current ? 'style="cursor:default"' : `data-hash="${esc(d.hash)}"`}><div class="ico" style="background:${d.current ? '#30a46c' : '#8a8f94'}">${icon('laptop')}</div>
      <div class="t"><div>${esc(d.device || d.app)}${d.current ? ' <span style="color:var(--accent);font-size:13px">· this session</span>' : ''}</div><div>${esc(d.app)} · ${esc(d.platform)} ${esc(d.system)}</div><div>${esc(d.ip)} · ${esc(d.country)} · ${fmtTime(d.active)}</div></div></div>`;
    const cur = r.devices.filter((d) => d.current), other = r.devices.filter((d) => !d.current);
    body.innerHTML = `<div class="section-title">This device</div><div class="card">${cur.map(row).join('')}</div>
      <div class="section-title">Active sessions</div><div class="card">${other.map(row).join('') || '<div class="empty">None</div>'}</div>
      <div class="hint">Tap a session to log it out. Telegram only lets an account end other sessions once its own session is at least a day old.</div>`;
    body.onclick = async (e) => {
      const r = e.target.closest('[data-hash]'); if (!r) return;
      if (!confirm('Log out this session?')) return;
      try { await api(A('/devices/terminate', aid), { json: { hash: r.dataset.hash } }); r.remove(); toast('Session ended'); }
      catch (er) { toast(er.message.includes('FRESH_RESET') ? 'This login is too new to end other sessions yet. Try again tomorrow.' : er.message); }
    };
  } catch (e) { body.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

// ------------------------------------------------------------------ settings
function setRow(ic, color, t, sub, act, right = '') {
  return `<div class="set-row" data-s="${act}"><div class="ico" style="background:${color}">${icon(ic)}</div><div class="t"><div>${esc(t)}</div>${sub ? `<div>${esc(sub)}</div>` : ''}</div>${right}</div>`;
}
function openSettings() {
  const a = acc();
  const el = openPage({ title: 'Settings' });
  const body = el.querySelector('.page-body');
  const draw = () => {
    const th = { light: 'Light', dark: 'Dark', system: 'System' }[S.settings.theme];
    body.innerHTML = `<div class="profile-head" style="margin-bottom:4px">${avatar(a.id, 'me', a.name, a.has_photo, 'xl')}<div><div class="n">${esc(a.name)}</div><div class="s">${esc(a.phone || '')}${a.username ? ' · @' + esc(a.username) : ''}</div></div></div>
      <div class="card">
        ${setRow('profile', '#1ea5e9', 'Account', 'Number, Username, Bio', 'account')}
        ${setRow('chat', '#f5a623', 'Chat Settings', `Theme: ${th}, Text size ${S.settings.fs}`, 'chat')}
        ${setRow('key', '#30a46c', 'Privacy & Security', `Passcode lock: ${lockEnabled() ? 'on' : 'off'}, active sessions`, 'privacy')}
        ${setRow('bell', '#e94b4b', 'Notifications', S.settings.notify ? 'On' : 'Off', 'notify')}
        ${setRow('pie', '#3b6fe0', 'Data and Storage', S.settings.autoload ? 'Auto-download photos: on' : 'Auto-download photos: off', 'data')}
        ${setRow('folder', '#1ea5e9', 'Chat Folders', 'Sort chats into folders', 'folders')}
        ${setRow('laptop', '#22b3c4', 'Devices', 'Manage connected devices', 'devices')}
        ${setRow('globe', '#9b59e0', 'Language', 'English', 'lang')}
        ${setRow('info', '#e67e22', 'Error log', 'Recent problems, to send for support', 'logs')}
      </div>
      <div class="card">
        ${setRow('group', '#3ba99c', 'Accounts', `${S.accounts.length} loaded${S.source ? ' from ' + S.source : ''}`, 'accounts')}
        ${setRow('phone', '#4c6ef5', 'Add account', 'Phone number + code, session string or file', 'addacc')}
        ${setRow('inbox', '#22b8cf', 'Unified Inbox', 'Unread chats from every account', 'inbox')}
        ${setRow('star', '#8e6cf0', 'Telegram Premium', a && a.premium ? 'Active' : 'Manage in official app', 'premium')}
        ${S.appMode ? '' : setRow('logout', '#8a8f94', 'Lock web panel', 'Log out of this browser', 'logout')}
      </div>
      <div class="card">${setRow('code', '#6366f1', 'About the developer', 'Nitin Shukla · GitHub · Portfolio', 'about')}</div>
      <div class="hint" style="text-align:center">SessionGram · developed by Nitin Shukla</div>`;
  };
  draw();
  body.onclick = async (e) => {
    const r = e.target.closest('[data-s]'); if (!r) return;
    const s = r.dataset.s;
    if (s === 'account') openProfile();
    if (s === 'folders') openFolders();
    if (s === 'devices') openDevices();
    if (s === 'accounts') openAccountsManager();
    if (s === 'addacc') openAddAccount();
    if (s === 'inbox') openInbox();
    if (s === 'about') openAbout();
    if (s === 'lang') toast('Only English is available');
    if (s === 'logs') openLogs();
    if (s === 'premium') toast('Telegram Premium can be managed in the official app');
    if (s === 'logout') { if (confirm('Lock this browser? You will need the web password again.')) { await api('/api/logout', { method: 'POST' }).catch(() => { }); location.reload(); } }
    if (s === 'chat') openChatSettings(draw);
    if (s === 'notify') openNotifySettings(draw);
    if (s === 'data') openDataSettings(draw);
    if (s === 'privacy') openPrivacy(draw);
  };
}
function openPrivacy(after) {
  const p = openPage({ title: 'Privacy & Security' });
  const pb = p.querySelector('.page-body');
  const draw = () => {
    const on = lockEnabled();
    pb.innerHTML = `<div class="section-title">Passcode lock</div><div class="card">
        <div class="set-row" data-s="pass"><div class="ico" style="background:#30a46c">${icon('lock')}</div><div class="t"><div>Passcode lock</div><div>${on ? 'On: asks for your code to open SessionGram' : 'Off'}</div></div><div class="switch ${on ? 'on' : ''}"></div></div>
        ${on ? `<div class="set-row" data-s="after"><div class="ico" style="background:#f5a524">${icon('clock')}</div><div class="t"><div>Auto-lock</div><div>After ${({ 0: 'leaving the app', 60: '1 minute', 300: '5 minutes', 3600: '1 hour' })[S.settings.lockAfter] || S.settings.lockAfter + ' s'} away</div></div></div>` : ''}</div>
      <div class="card">${setRow('laptop', '#22b3c4', 'Active Sessions', 'See and end logins of this account', 'devices')}
        ${S.appMode ? '' : setRow('key', '#30a46c', 'Web panel password', 'Stored in config.json next to server.py', 'pw')}</div>
      <div class="card">${toggleRow('Send typing status', 'Others see "typing…" while you write', 'typing')}</div>
      <div class="hint">Session strings and API hashes stay inside SessionGram and are never shown in the interface. Keep exported sessions files private: anyone with them can use your accounts.</div>`;
  };
  draw();
  pb.addEventListener('click', (ev) => {
    const x = ev.target.closest('[data-s],[data-t]'); if (!x) return;
    if (x.dataset.t) { S.settings[x.dataset.t] = !S.settings[x.dataset.t]; saveSettings(); draw(); return; }
    const k = x.dataset.s;
    if (k === 'devices') openDevices();
    if (k === 'pw') toast('Edit "password" in config.json, then restart the server');
    if (k === 'pass') { if (lockEnabled()) { if (confirm('Turn off the passcode lock?')) { store.set('pass', null); draw(); after && after(); } } else setupPasscode(() => { draw(); after && after(); }); }
    if (k === 'after') sheet('Lock automatically', [[0, 'Right after leaving'], [60, 'After 1 minute'], [300, 'After 5 minutes'], [3600, 'After 1 hour']].map(([v, l]) => ({ icon: v === S.settings.lockAfter ? 'done' : 'clock', label: l, fn: () => { S.settings.lockAfter = v; saveSettings(); draw(); } })));
  });
}
function toggleRow(label, sub, key) {
  return `<div class="set-row" data-t="${key}"><div class="t"><div>${esc(label)}</div>${sub ? `<div>${esc(sub)}</div>` : ''}</div><div class="switch ${S.settings[key] ? 'on' : ''}"></div></div>`;
}
function bindToggles(el, after) {
  el.querySelector('.page-body').addEventListener('click', (e) => {
    const r = e.target.closest('[data-t]'); if (!r) return;
    const k = r.dataset.t; S.settings[k] = !S.settings[k]; saveSettings();
    r.querySelector('.switch').classList.toggle('on', S.settings[k]);
    if (k === 'notify' && S.settings.notify && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    after && after();
  });
}
function openChatSettings(after) {
  const el = openPage({ title: 'Chat Settings', body: `<div class="section-title">Theme</div><div class="card">
      ${['light', 'dark', 'system'].map((t) => `<div class="set-row" data-th="${t}"><div class="t"><div>${t[0].toUpperCase() + t.slice(1)}</div></div><div class="switch ${S.settings.theme === t ? 'on' : ''}"></div></div>`).join('')}</div>
    <div class="section-title">Message text size</div><div class="card" style="padding:16px"><input type="range" min="13" max="22" value="${S.settings.fs}" style="width:100%"><div class="hint" style="padding:6px 0 0">Size: <b class="fsv">${S.settings.fs}</b></div></div>` });
  el.querySelector('.page-body').addEventListener('click', (e) => {
    const r = e.target.closest('[data-th]'); if (!r) return;
    S.settings.theme = r.dataset.th; saveSettings();
    el.querySelectorAll('[data-th] .switch').forEach((s) => s.classList.toggle('on', s.closest('[data-th]').dataset.th === S.settings.theme));
    after && after();
  });
  el.querySelector('input[type=range]').oninput = (e) => { S.settings.fs = +e.target.value; el.querySelector('.fsv').textContent = S.settings.fs; saveSettings(); after && after(); };
}
function openNotifySettings(after) {
  const secure = window.isSecureContext && 'Notification' in window;
  const el = openPage({ title: 'Notifications', body: `<div class="card">${toggleRow('In-app notifications', 'Pop-up for new messages', 'notify')}
      ${toggleRow('Sound', 'Play a short tone', 'sound')}${toggleRow('All accounts', 'Notify for every account, not just the open one', 'allAccounts')}</div>
      <div class="hint">${secure ? 'System notifications are enabled when your browser allows them.' : 'System (lock-screen) notifications need HTTPS or localhost; over plain http on Wi-Fi you get in-app pop-ups and sound.'} Muted chats never notify.</div>` });
  bindToggles(el, after);
}
function openDataSettings(after) {
  const el = openPage({ title: 'Data and Storage', body: `<div class="card">${toggleRow('Auto-download photos', 'Show photos and link previews automatically', 'autoload')}</div>
      <div class="hint">Media is downloaded by the server and cached in the cache/ folder next to server.py. Delete that folder any time to free space.</div>` });
  bindToggles(el, after);
}

// ------------------------------------------------------------------ accounts manager
function openAccountsManager() {
  const el = openPage({ title: 'Accounts', actions: `<button class="icon-btn m-reload">${icon('refresh')}</button>` });
  const body = el.querySelector('.page-body');
  const draw = () => {
    body.innerHTML = `${S.loadError ? `<div class="banner">${esc(S.loadError)}</div>` : ''}
      <div class="card">${S.accounts.map((x) => `<div class="set-row" data-acc="${x.id}">
        <div style="position:relative">${avatar(x.id, 'me', x.name, x.status === 'online' && x.has_photo, 'sm')}<span class="dot ${x.status}" style="position:absolute;right:0;bottom:0;width:11px;height:11px;border-radius:50%;border:2px solid var(--card)"></span></div>
        <div class="t"><div>${esc(x.name)} ${x.id === S.aid ? '<span style="color:var(--accent);font-size:13px">· open</span>' : ''}</div><div>${esc(x.phone || '')} · ${esc(x.status)}${x.unread ? ' · ' + x.unread + ' unread' : ''}</div>${x.error ? `<div style="color:#e2504c;white-space:normal">${esc(x.error)}</div>` : ''}</div>
        ${x.status !== 'online' ? `<button class="btn ghost" style="flex:none;padding:8px 12px" data-rc="${x.id}">Retry</button>` : ''}</div>`).join('') || '<div class="empty">No accounts loaded</div>'}</div>
      <div class="btn-row"><button class="btn" data-add>${icon('add').replace('<svg', '<svg style="vertical-align:middle;width:20px;height:20px"')} Add account</button></div>
      <div class="btn-row" style="padding-top:0"><button class="btn ghost" data-up>${icon('upload').replace('<svg', '<svg style="vertical-align:middle;width:20px;height:20px"')} Upload file</button>
        <a class="btn ghost" data-export href="/api/accounts/export" download style="text-decoration:none">${icon('download').replace('<svg', '<svg style="vertical-align:middle;width:20px;height:20px"')} Download file</a></div>
      <input type="file" class="hidden" accept=".xlsx,.xls,.xlsm,.csv">
      <div class="hint">The sheet needs 4 columns in this order: <b>phone number</b>, <b>api id</b>, <b>api hash</b>, <b>Telethon session string</b>. One account per row; a header row is fine.
      <b>Add account</b> logs in one more account and adds it to the file. <b>Upload file</b> replaces the whole file and reconnects every account. Tap an account for more options.</div>`;
  };
  draw();
  const fileIn = () => body.querySelector('input[type=file]');
  body.onclick = async (e) => {
    const rc = e.target.closest('[data-rc]'); if (rc) { e.stopPropagation(); await reconnectAccount(rc.dataset.rc); draw(); return; }
    if (e.target.closest('[data-up]')) { fileIn().click(); return; }
    if (e.target.closest('[data-add]')) { openAddAccount(draw); return; }
    const r = e.target.closest('[data-acc]'); if (!r) return;
    const x = acc(r.dataset.acc);
    sheet(x ? x.name : null, [
      x && x.status === 'online' && { icon: 'chat', label: 'Open this account', fn: () => closeAll(() => switchAccount(x.id)) },
      { icon: 'refresh', label: 'Reconnect', fn: async () => { await reconnectAccount(r.dataset.acc); draw(); } },
      { icon: 'delete', label: 'Remove from app and sessions file', red: true, fn: async () => {
        if (!confirm(`Remove ${x ? x.name : 'this account'}? It is deleted from the sessions file too (the Telegram account itself is not affected).`)) return;
        try { const res = await api('/api/accounts/remove', { json: { id: r.dataset.acc } }); S.accounts = res.accounts; S.source = res.source; delete S.dialogs[r.dataset.acc]; afterReload(); draw(); toast('Account removed'); }
        catch (er) { toast(er.message); }
      } },
    ]);
  };
  body.addEventListener('change', async (e) => {
    if (e.target.type !== 'file' || !e.target.files[0]) return;
    const fd = new FormData(); fd.append('file', e.target.files[0]);
    toast('Uploading and connecting accounts…');
    try { const r = await api('/api/accounts/upload', { method: 'POST', body: fd }); S.accounts = r.accounts; S.loadError = r.error; S.source = r.source; S.dialogs = {}; S.folders = {}; afterReload(); draw(); toast(`${r.accounts.filter((a) => a.status === 'online').length} of ${r.accounts.length} accounts online`); }
    catch (er) { toast(er.message); }
  });
  el.querySelector('.m-reload').onclick = async () => {
    toast('Reloading sessions file…');
    try { const r = await api('/api/accounts/reload', { method: 'POST' }); S.accounts = r.accounts; S.loadError = r.error; S.source = r.source; S.dialogs = {}; S.folders = {}; afterReload(); draw(); }
    catch (er) { toast(er.message); }
  };
}
function openAddAccount(after) {
  sheet('Add an account', [
    { icon: 'phone', label: 'Log in with phone number', fn: () => openPhoneLogin(after) },
    { icon: 'key', label: 'Paste a session string', fn: () => openSessionLogin(after) },
    { icon: 'upload', label: 'Upload a sessions file', fn: openAccountsManager },
  ]);
}
function openSessionLogin(after) {
  const f = openPage({ title: 'Session string login', actions: `<button class="icon-btn f-save">${icon('done')}</button>`, plain: true,
    body: `<div class="form">
      <label class="field"><span>API ID</span><input name="api_id" inputmode="numeric" autocomplete="off" placeholder="12345678"></label>
      <label class="field"><span>API hash</span><input name="api_hash" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="32 characters"></label>
      <label class="field"><span>Telethon session string</span><textarea name="session" rows="5" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="1BVtsOK…"></textarea></label>
      <label class="field"><span>Phone number (optional)</span><input name="phone" type="tel" placeholder="Filled in automatically"></label>
      <div class="hint" style="padding:0">The account is logged in right away and saved to your sessions file, so it opens automatically next time.</div>
      <div class="err"></div>
      <button class="btn f-go" style="width:100%;margin-top:14px">Log in</button></div>` });
  const go = async () => {
    const data = {}; ['api_id', 'api_hash', 'session', 'phone'].forEach((k) => { data[k] = f.querySelector(`[name=${k}]`).value.trim(); });
    const btn = f.querySelector('.f-go'); btn.disabled = true; btn.textContent = 'Logging in…'; f.querySelector('.err').textContent = '';
    try {
      const r = await api('/api/accounts/add', { json: data });
      S.accounts = r.accounts; S.source = r.source; S.loadError = r.error;
      toast(`Added ${r.account.name}`);
      closeAll(() => { switchAccount(r.account.id); scheduleDrawer(); after && after(); });
    } catch (e) { f.querySelector('.err').textContent = e.message; btn.disabled = false; btn.textContent = 'Log in'; }
  };
  f.querySelector('.f-go').onclick = go; f.querySelector('.f-save').onclick = go;
}
async function openLogs() {
  const el = openPage({ title: 'Error log', actions: `<button class="icon-btn l-copy">${icon('copy')}</button>`, plain: true });
  const body = el.querySelector('.page-body');
  let logs = [];
  try { logs = (await api('/api/logs')).logs; } catch (e) { body.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  body.innerHTML = logs.map((l) => `<div class="info-row"><div class="v" style="font-size:14px">${esc(l.msg)}</div><div class="k">${esc(l.level)} · ${fmtTime(l.t)} ${fmtClock(l.t)}</div></div>`).join('') || '<div class="empty">No errors so far.</div>';
  el.querySelector('.l-copy').onclick = () => copyText(logs.map((l) => `${new Date(l.t * 1000).toISOString()} ${l.level} ${l.msg}`).join('\n') || 'No errors');
}
function afterReload() {
  if (!acc(S.aid)) S.aid = (S.accounts.find((a) => a.status === 'online') || S.accounts[0] || {}).id || null;
  store.set('aid', S.aid);
  scheduleDrawer(); renderMain();
  if (acc()?.status === 'online') loadDialogs(S.aid);
}

// ------------------------------------------------------------------ realtime
let ws, wsWasOpen = false;
function connectWS() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
  ws.onopen = () => {
    if (wsWasOpen) { loadAccounts().then(() => { Object.keys(S.dialogs).forEach((id) => loadDialogs(id)); }).catch(() => { }); }
    wsWasOpen = true;
  };
  ws.onmessage = (e) => { try { onEvent(JSON.parse(e.data)); } catch (err) { console.error(err); } };
  ws.onclose = (e) => { if (e.code === 4401) return showLogin(); setTimeout(connectWS, 2500); };
}
setInterval(() => { if (ws && ws.readyState === 1) ws.send('ping'); }, 25000);

function upsertDialog(aid, d) {
  if (!d || !S.dialogs[aid]) return;
  const arr = S.dialogs[aid];
  const i = arr.findIndex((x) => String(x.id) === String(d.id));
  if (i >= 0) arr[i] = d; else arr.unshift(d);
}
function onEvent(ev) {
  const a = acc(ev.account);
  switch (ev.type) {
    case 'account': updateAccount(ev.account); if (ev.account.id === S.aid) scheduleRender(); return;
    case 'reloaded': S.dialogs = {}; S.folders = {}; loadAccounts(); return;
    case 'dialog': upsertDialog(ev.account, ev.dialog); if (a && ev.account_unread != null) a.unread = ev.account_unread; if (ev.account === S.aid) scheduleRender(); return;
    case 'dialogs_changed': if (S.dialogs[ev.account]) loadDialogs(ev.account); return;
    case 'account_removed': {
      S.accounts = S.accounts.filter((x) => x.id !== ev.id); delete S.dialogs[ev.id]; delete S.folders[ev.id];
      if (S.aid === ev.id) { S.aid = null; afterReload(); } else { scheduleDrawer(); renderMainHead(); }
      return;
    }
    case 'message': {
      upsertDialog(ev.account, ev.dialog);
      if (a && ev.account_unread != null) a.unread = ev.account_unread;
      const C = S.chat;
      const inOpen = C && C.aid === ev.account && String(C.id) === String(ev.chat_id);
      if (inOpen) { addMessages(C, [ev.message], 'append'); if (!ev.message.out) markReadSoon(); if (ev.message.service && /pinned/.test(ev.message.text)) loadPinned(C); }
      if (!ev.message.out && !(inOpen && !document.hidden)) notify(ev);
      if (ev.account === S.aid) scheduleRender(); else renderMainHead();
      scheduleDrawer();
      return;
    }
    case 'edited': {
      upsertDialog(ev.account, ev.dialog);
      const C = S.chat;
      if (C && C.aid === ev.account && String(C.id) === String(ev.chat_id)) replaceMessage(C, ev.message);
      return;
    }
    case 'deleted': {
      const C = S.chat;
      if (C && C.aid === ev.account && (ev.chat_id == null || String(C.id) === String(ev.chat_id))) removeMessages(C, ev.ids);
      return;
    }
    case 'read': {
      const d = findDialog(ev.chat_id, ev.account);
      if (ev.outbox) {
        if (d) d.read_outbox = Math.max(d.read_outbox || 0, ev.max_id);
        const C = S.chat;
        if (C && C.aid === ev.account && String(C.id) === String(ev.chat_id)) { C.readOutbox = Math.max(C.readOutbox, ev.max_id); updateTicks(C); }
      } else if (ev.dialog) upsertDialog(ev.account, ev.dialog);
      if (a && ev.account_unread != null) a.unread = ev.account_unread;
      if (ev.account === S.aid) scheduleRender();
      scheduleDrawer();
      return;
    }
    case 'reactions': {
      const C = S.chat;
      if (C && C.aid === ev.account && String(C.id) === String(ev.chat_id)) { const m = C.byId.get(ev.id); if (m) { m.reactions = ev.reactions; replaceMessage(C, m); } }
      return;
    }
    case 'typing': {
      const C = S.chat;
      if (C && C.aid === ev.account && String(C.id) === String(ev.chat_id)) {
        const sub = C.el.querySelector('.c-sub'); if (!sub) return;
        sub.textContent = 'typing…'; sub.classList.add('typing');
        clearTimeout(C.typingT); C.typingT = setTimeout(() => { sub.classList.remove('typing'); sub.textContent = C.info ? (C.info.status || '') : ''; }, 5000);
      }
    }
  }
}
let audioCtx;
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = 880; o.type = 'sine'; g.gain.setValueAtTime(0.12, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
    o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.26);
  } catch { }
}
function notify(ev) {
  if (!S.settings.notify) return;
  if (ev.dialog && ev.dialog.muted) return;
  if (ev.account !== S.aid && !S.settings.allAccounts) return;
  const a = acc(ev.account);
  const name = ev.dialog ? ev.dialog.name : 'New message';
  const m = ev.message;
  const text = (m.sender_name && ev.dialog && ev.dialog.kind === 'group' ? m.sender_name + ': ' : '') + (m.text || (m.media ? m.media.kind : ''));
  const prefix = S.accounts.length > 1 && a ? `[${a.name}] ` : '';
  const go = () => { if (ev.account !== S.aid) switchAccount(ev.account); closeAll(() => openChat(ev.chat_id)); };
  if (document.hidden && window.isSecureContext && 'Notification' in window && Notification.permission === 'granted') {
    try { const n = new Notification(prefix + name, { body: text.slice(0, 160), tag: ev.account + ':' + ev.chat_id }); n.onclick = () => { window.focus(); go(); n.close(); }; } catch { }
  } else {
    toast(`${prefix}${name}: ${text.slice(0, 80)}`, go);
  }
  if (S.settings.sound) beep();
  if (navigator.vibrate && document.hidden === false) { try { navigator.vibrate(60); } catch { } }
}

// ------------------------------------------------------------------ phone number + code login
const COUNTRIES = [
  ['India', '91', 'IN'], ['United States', '1', 'US'], ['United Kingdom', '44', 'GB'], ['Canada', '1', 'CA'], ['Australia', '61', 'AU'],
  ['Germany', '49', 'DE'], ['France', '33', 'FR'], ['Italy', '39', 'IT'], ['Spain', '34', 'ES'], ['Netherlands', '31', 'NL'],
  ['Russia', '7', 'RU'], ['Ukraine', '380', 'UA'], ['Belarus', '375', 'BY'], ['Kazakhstan', '7', 'KZ'], ['Uzbekistan', '998', 'UZ'],
  ['Turkey', '90', 'TR'], ['Iran', '98', 'IR'], ['Iraq', '964', 'IQ'], ['Saudi Arabia', '966', 'SA'], ['United Arab Emirates', '971', 'AE'],
  ['Egypt', '20', 'EG'], ['Nigeria', '234', 'NG'], ['Kenya', '254', 'KE'], ['South Africa', '27', 'ZA'], ['Ethiopia', '251', 'ET'],
  ['Pakistan', '92', 'PK'], ['Bangladesh', '880', 'BD'], ['Nepal', '977', 'NP'], ['Sri Lanka', '94', 'LK'], ['Indonesia', '62', 'ID'],
  ['Malaysia', '60', 'MY'], ['Singapore', '65', 'SG'], ['Philippines', '63', 'PH'], ['Vietnam', '84', 'VN'], ['Thailand', '66', 'TH'],
  ['China', '86', 'CN'], ['Hong Kong', '852', 'HK'], ['Japan', '81', 'JP'], ['South Korea', '82', 'KR'], ['Brazil', '55', 'BR'],
  ['Mexico', '52', 'MX'], ['Argentina', '54', 'AR'], ['Colombia', '57', 'CO'], ['Chile', '56', 'CL'], ['Peru', '51', 'PE'],
  ['Poland', '48', 'PL'], ['Romania', '40', 'RO'], ['Portugal', '351', 'PT'], ['Sweden', '46', 'SE'], ['Switzerland', '41', 'CH'],
  ['Israel', '972', 'IL'], ['Afghanistan', '93', 'AF'], ['Azerbaijan', '994', 'AZ'], ['Georgia', '995', 'GE'], ['Armenia', '374', 'AM'],
];
function defaultCountry() {
  const reg = (navigator.language || '').split('-')[1];
  return (COUNTRIES.find((c) => c[2] === reg) || COUNTRIES[0])[2];
}
function openPhoneLogin(after) {
  const el = openPage({ title: 'Log in to Telegram', plain: true, onClose: () => { if (st.lid && !st.done) api('/api/phone/cancel', { json: { lid: st.lid } }).catch(() => { }); clearInterval(st.timer); } });
  const body = el.querySelector('.page-body');
  const st = { step: 1, lid: null, len: 5, phone: '', done: false, timer: null, cfg: null };
  const steps = (n) => `<div class="steps">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
  const busy = (btn, on, label) => { btn.disabled = on; btn.textContent = on ? 'Please wait…' : label; };

  const stepPhone = () => {
    st.step = 1;
    const saved = st.cfg && st.cfg.has_saved_api;
    const cc = store.get('login_cc', defaultCountry());
    body.innerHTML = `<div class="auth">${steps(1)}<div class="auth-hero">${icon('phone')}</div>
      <h2>Your phone number</h2><p class="lead">Telegram will send a login code to this number, usually inside the Telegram app on your other device.</p>
      <label class="field"><span>Country</span><select class="cc">${COUNTRIES.map((c) => `<option value="${c[2]}" data-code="${c[1]}" ${c[2] === cc ? 'selected' : ''}>${esc(c[0])} (+${c[1]})</option>`).join('')}</select></label>
      <label class="field"><span>Phone number</span><div class="phone-in"><input class="code" value="" inputmode="tel" style="width:84px;flex:none"><input class="num" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="98765 43210"></div></label>
      <details class="adv" ${saved ? '' : 'open'}><summary>${saved ? `Telegram API credentials: using saved API ID ${esc(st.cfg.api_id)}` : 'Telegram API credentials (needed once)'}</summary>
        <label class="field"><span>API ID</span><input class="api_id" inputmode="numeric" autocomplete="off" placeholder="${saved ? 'Leave empty to use the saved one' : '12345678'}"></label>
        <label class="field"><span>API hash</span><input class="api_hash" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${saved ? 'Leave empty to use the saved one' : '32 characters'}"></label>
        <div class="hint" style="padding:0 0 10px">Get both for free at <a href="https://my.telegram.org/apps" target="_blank" rel="noopener">my.telegram.org</a> › API development tools. SessionGram remembers them on this device for every account you add.</div></details>
      <div class="err"></div><button class="btn grad go" style="margin-top:14px">Send code</button></div>`;
    const sel = body.querySelector('.cc'), code = body.querySelector('.code'), num = body.querySelector('.num');
    const syncCode = () => { code.value = '+' + sel.selectedOptions[0].dataset.code; };
    syncCode();
    sel.onchange = () => { store.set('login_cc', sel.value); syncCode(); num.focus(); };
    code.oninput = () => { const v = code.value.replace(/\D/g, ''); const m = COUNTRIES.find((c) => c[1] === v); if (m) sel.value = m[2]; };
    num.onkeydown = (e) => { if (e.key === 'Enter') go(); };
    setTimeout(() => num.focus(), 280);
    const go = async () => {
      const btn = body.querySelector('.go'), err = body.querySelector('.err'); err.textContent = '';
      const phone = code.value.replace(/[^\d+]/g, '') + num.value.replace(/\D/g, '');
      if (num.value.replace(/\D/g, '').length < 4) { err.textContent = 'Enter your phone number'; return; }
      const api_id = body.querySelector('.api_id').value.trim(), api_hash = body.querySelector('.api_hash').value.trim();
      const useSaved = saved && !api_id && !api_hash;
      if (!useSaved && (!api_id || !api_hash)) { err.textContent = 'Enter your API ID and API hash (from my.telegram.org)'; body.querySelector('.adv').open = true; return; }
      busy(btn, true);
      try {
        const r = await api('/api/phone/start', { json: { phone, api_id, api_hash, use_saved: useSaved } });
        Object.assign(st, { lid: r.lid, len: r.length || 5, phone: r.phone, via: r.via, next: r.next, timeout: r.timeout });
        stepCode();
      } catch (e) { err.textContent = e.message; busy(btn, false, 'Send code'); }
    };
    body.querySelector('.go').onclick = go;
  };

  const stepCode = () => {
    st.step = 2;
    const where = { app: 'to the Telegram app on your other device', sms: 'by SMS', call: 'with a phone call', email: 'to your email', fragment: 'to your Fragment number' }[st.via] || 'by SMS';
    body.innerHTML = `<div class="auth">${steps(2)}<div class="auth-hero">${icon('chat')}</div>
      <h2>${esc(st.phone)}</h2><p class="lead">We've sent the code ${where}.</p>
      <div class="otp">${Array.from({ length: st.len }, () => '<input inputmode="numeric" autocomplete="one-time-code" aria-label="Code digit">').join('')}</div>
      <div class="err" style="text-align:center"></div>
      <button class="btn grad go" style="margin-top:10px">Verify</button>
      <button class="linkish resend" disabled></button>
      <button class="linkish back" style="color:var(--text2);font-weight:500">Wrong number?</button></div>`;
    const boxes = [...body.querySelectorAll('.otp input')];
    const value = () => boxes.map((b) => b.value).join('');
    boxes.forEach((b, i) => {
      b.oninput = () => {
        const d = b.value.replace(/\D/g, '');
        if (d.length > 1) { fill(d); return; }          // pasted or autofilled the whole code
        b.value = d;
        if (d && i < boxes.length - 1) boxes[i + 1].focus();
        if (value().length === boxes.length) submit();
      };
      b.onkeydown = (e) => { if (e.key === 'Backspace' && !b.value && i > 0) { boxes[i - 1].focus(); boxes[i - 1].value = ''; } if (e.key === 'Enter') submit(); };
      b.onpaste = (e) => { const t = (e.clipboardData || window.clipboardData).getData('text'); if (t) { e.preventDefault(); fill(t); } };
    });
    const fill = (t) => { const d = t.replace(/\D/g, '').slice(0, boxes.length).split(''); boxes.forEach((b, k) => { b.value = d[k] || ''; }); (boxes[d.length] || boxes[boxes.length - 1]).focus(); if (d.length === boxes.length) submit(); };
    setTimeout(() => boxes[0].focus(), 280);
    let sending = false;
    const submit = async () => {
      if (sending) return;
      const c = value(); const err = body.querySelector('.err'); err.textContent = '';
      if (c.length < boxes.length) { err.textContent = 'Enter all digits of the code'; return; }
      sending = true; const btn = body.querySelector('.go'); busy(btn, true);
      try {
        const r = await api('/api/phone/code', { json: { lid: st.lid, code: c } });
        if (r.need_password) { st.hint = r.hint; stepPassword(); return; }
        done(r);
      } catch (e) {
        err.textContent = e.message; busy(btn, false, 'Verify'); sending = false;
        const o = body.querySelector('.otp'); o.classList.remove('shake'); void o.offsetWidth; o.classList.add('shake');
        boxes.forEach((b) => { b.value = ''; }); boxes[0].focus();
        if (/expired|Start again/.test(e.message)) { st.lid = null; setTimeout(stepPhone, 1600); }
      }
    };
    body.querySelector('.go').onclick = submit;
    body.querySelector('.back').onclick = () => { api('/api/phone/cancel', { json: { lid: st.lid } }).catch(() => { }); st.lid = null; clearInterval(st.timer); stepPhone(); };
    const rs = body.querySelector('.resend');
    let left = Math.min(st.timeout || 60, 120);
    const tick = () => {
      if (left > 0) { rs.disabled = true; rs.textContent = `Resend code in ${fmtDur(left)}`; left--; }
      else { rs.disabled = false; rs.textContent = st.next ? `Send the code ${st.next === 'sms' ? 'by SMS' : st.next === 'call' ? 'by phone call' : 'again'}` : 'Send the code again'; clearInterval(st.timer); }
    };
    clearInterval(st.timer); tick(); st.timer = setInterval(tick, 1000);
    rs.onclick = async () => {
      rs.disabled = true;
      try { const r = await api('/api/phone/resend', { json: { lid: st.lid } }); Object.assign(st, { via: r.via, next: r.next, timeout: r.timeout, len: r.length || st.len }); toast('Code sent again'); stepCode(); }
      catch (e) { toast(e.message); rs.disabled = false; }
    };
  };

  const stepPassword = () => {
    st.step = 3; clearInterval(st.timer);
    body.innerHTML = `<div class="auth">${steps(3)}<div class="auth-hero">${icon('lock')}</div>
      <h2>Two-step verification</h2><p class="lead">This account is protected with an extra password.</p>
      <label class="field"><span>Password${st.hint ? ` (hint: ${esc(st.hint)})` : ''}</span><div class="phone-in"><input class="pw" type="password" autocomplete="current-password"><button class="icon-btn eye" type="button" style="color:var(--text2)">${icon('eye')}</button></div></label>
      <div class="err"></div><button class="btn grad go" style="margin-top:10px">Log in</button></div>`;
    const pw = body.querySelector('.pw');
    body.querySelector('.eye').onclick = () => { pw.type = pw.type === 'password' ? 'text' : 'password'; };
    setTimeout(() => pw.focus(), 280);
    const go = async () => {
      const btn = body.querySelector('.go'), err = body.querySelector('.err'); err.textContent = '';
      if (!pw.value) { err.textContent = 'Enter your password'; return; }
      busy(btn, true);
      try { done(await api('/api/phone/password', { json: { lid: st.lid, password: pw.value } })); }
      catch (e) { err.textContent = e.message; busy(btn, false, 'Log in'); pw.select(); }
    };
    pw.onkeydown = (e) => { if (e.key === 'Enter') go(); };
    body.querySelector('.go').onclick = go;
  };

  const done = (r) => {
    st.done = true; clearInterval(st.timer);
    S.accounts = r.accounts; S.source = r.source; S.loadError = r.error;
    body.innerHTML = `<div class="auth" style="justify-content:center"><div class="auth-hero" style="background:linear-gradient(135deg,#30a46c,#22b8cf)">${icon('done')}</div>
      <h2>Welcome, ${esc(r.account.name)}!</h2><p class="lead">You're logged in. This account is saved and opens automatically from now on.</p></div>`;
    setTimeout(() => closeAll(() => { switchAccount(r.account.id); scheduleDrawer(); after && after(); }), 1300);
  };

  body.innerHTML = '<div class="empty">Loading…</div>';
  api('/api/phone/config').then((c) => { st.cfg = c; stepPhone(); }).catch(() => { st.cfg = {}; stepPhone(); });
}

// ------------------------------------------------------------------ unified inbox (unread chats from every account)
async function openInbox() {
  const el = openPage({ title: 'Unified Inbox', sub: 'Unread chats from all accounts', plain: true, actions: `<button class="icon-btn i-ref">${icon('refresh')}</button>` });
  const body = el.querySelector('.page-body');
  const draw = async () => {
    body.innerHTML = '<div class="skeleton"></div>'.repeat(6);
    try {
      const r = await api('/api/inbox?limit=300');
      if (!r.dialogs.length) { body.innerHTML = `<div class="empty"><div class="empty-art">${icon('done_all')}</div><b style="color:var(--text);font-size:18px">All caught up</b><br>No unread chats in any of your ${S.accounts.length} accounts.</div>`; return; }
      body.innerHTML = (r.total > r.dialogs.length ? `<div class="hint">Showing the newest ${r.dialogs.length} of ${r.total} unread chats</div>` : '') +
        r.dialogs.map((d) => dialogRow(d, d.account).replace('<div class="l1">', `<div class="l1"><span class="acc-chip">${esc(d.account_name)}</span>`).replace('data-peer=', `data-acc="${d.account}" data-peer=`)).join('');
    } catch (e) { body.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
  };
  draw();
  el.querySelector('.i-ref').onclick = draw;
  body.onclick = (e) => {
    const r = e.target.closest('[data-peer]'); if (!r || wasLong(r)) return;
    const aid = r.dataset.acc, pid = r.dataset.peer;
    closeAll(() => { if (aid !== S.aid) switchAccount(aid); const t = () => (dialogsOf(aid) ? openChat(pid) : setTimeout(t, 200)); t(); });
  };
  onLongPress(body, (e) => { const r = e.target.closest && e.target.closest('[data-peer]'); if (r) { r._lp = Date.now(); markRead(r.dataset.acc, r.dataset.peer).then(draw); } });
}

// ------------------------------------------------------------------ about the developer
const DEV = { name: 'Nitin Shukla', github: 'https://github.com/n0obcoders', portfolio: 'https://n0obcoders.github.io/portfoli0/' };
function openAbout() {
  const el = openPage({ title: 'About', plain: true, onClose: () => { cancelAnimationFrame(raf); clearTimeout(typeT); } });
  const body = el.querySelector('.page-body');
  body.innerHTML = `<div class="about-hero"><canvas></canvas>
      <div class="about-ava" title="Tap me">NS</div>
      <h2>${esc(DEV.name)}</h2><div class="role"><span class="rt"></span><span class="cur"></span></div></div>
    <div class="section-title">Find me online</div>
    <div class="card">
      <a class="link-card" href="${DEV.github}" target="_blank" rel="noopener"><div class="lc-ico" style="background:#24292f">${icon('github')}</div><div class="lc-t"><b>GitHub</b><span>github.com/n0obcoders</span></div>${icon('forward')}</a>
      <a class="link-card" href="${DEV.portfolio}" target="_blank" rel="noopener"><div class="lc-ico" style="background:var(--grad)">${icon('globe')}</div><div class="lc-t"><b>Portfolio</b><span>n0obcoders.github.io/portfoli0</span></div>${icon('forward')}</a>
    </div>
    <div class="btn-row"><button class="btn ghost" data-copy="${DEV.github}">${icon('copy').replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-4px"')} Copy GitHub</button><button class="btn ghost" data-copy="${DEV.portfolio}">${icon('copy').replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-4px"')} Copy portfolio</button></div>
    <div class="section-title">About SessionGram</div>
    <div class="card"><div class="info-row"><div class="v"><b>SessionGram</b> <span class="ver" style="color:var(--text2)"></span></div><div class="k">All your Telegram accounts in one fast, private app</div></div>
      <div class="info-row"><div class="v">${esc(DEV.name)}</div><div class="k">Designed and developed by</div></div></div>
    <div class="chips"><span>Multi-account</span><span>Phone + OTP login</span><span>Unified inbox</span><span>Reactions</span><span>Voice messages</span><span>Scheduled messages</span><span>Passcode lock</span><span>Built for 100+ accounts</span></div>
    <div class="hint" style="text-align:center;padding-bottom:30px">Made with ${icon('heart').replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px;color:#e5484d"')} by ${esc(DEV.name)}</div>`;
  api('/api/about').then((r) => { body.querySelector('.ver').textContent = 'v' + r.version; }).catch(() => { });
  body.onclick = (e) => { const c = e.target.closest('[data-copy]'); if (c) copyText(c.dataset.copy); };
  // typewriter role line
  const roles = ['Developer of SessionGram', 'github.com/n0obcoders', 'Building things for the web & Android'];
  let ri = 0, typeT;
  const rt = body.querySelector('.rt');
  const type = (txt, i = 0, del = false) => {
    rt.textContent = txt.slice(0, i);
    if (!del && i < txt.length) typeT = setTimeout(() => type(txt, i + 1), 45);
    else if (!del) typeT = setTimeout(() => type(txt, i, true), 1600);
    else if (i > 0) typeT = setTimeout(() => type(txt, i - 1, true), 18);
    else { ri++; typeT = setTimeout(() => type(roles[ri % roles.length]), 250); }
  };
  type(roles[0]);
  // tap the avatar for confetti; drag over the hero to stir the stars
  const cv = body.querySelector('canvas'), cx = cv.getContext('2d'), hero = body.querySelector('.about-hero');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0, raf;
  const fit = () => { W = hero.clientWidth; H = hero.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const P = Array.from({ length: 40 }, () => ({ x: Math.random() * 400, y: Math.random() * 300, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3, r: Math.random() * 1.6 + .5, life: Infinity }));
  const loop = () => {
    if (!W) fit();
    cx.clearRect(0, 0, W, H);
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.x += p.vx; p.y += p.vy;
      if (p.life !== Infinity) { p.vy += .08; if (--p.life <= 0) { P.splice(i, 1); continue; } }
      else { if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
      cx.fillStyle = p.c || 'rgba(255,255,255,.7)'; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fill();
    }
    raf = requestAnimationFrame(loop);
  };
  setTimeout(() => { fit(); loop(); }, 260);
  const confetti = (x, y) => { const cols = ['#fde68a', '#f9a8d4', '#a5f3fc', '#c7d2fe', '#ffffff', '#86efac']; for (let i = 0; i < 46; i++) { const a = Math.random() * 6.3, v = Math.random() * 5 + 2; P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, r: Math.random() * 3 + 1.5, life: 70, c: cols[i % cols.length] }); } };
  const ava = body.querySelector('.about-ava');
  ava.onclick = () => { const r = ava.getBoundingClientRect(), h0 = hero.getBoundingClientRect(); confetti(r.left - h0.left + r.width / 2, r.top - h0.top + r.height / 2); ava.style.transform = 'scale(1.12) rotate(-6deg)'; setTimeout(() => { ava.style.transform = ''; }, 220); if (navigator.vibrate) try { navigator.vibrate(12); } catch { } };
  hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); P.forEach((p) => { if (p.life === Infinity) { const dx = p.x - (e.clientX - r.left), dy = p.y - (e.clientY - r.top), d = Math.hypot(dx, dy); if (d < 70) { p.vx += dx / d * .3; p.vy += dy / d * .3; } } }); });
  body.querySelectorAll('.link-card').forEach((c) => {
    c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); c.style.transform = `perspective(600px) rotateY(${((e.clientX - r.left) / r.width - .5) * 8}deg) rotateX(${(.5 - (e.clientY - r.top) / r.height) * 8}deg)`; });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
}

// ------------------------------------------------------------------ passcode lock
// A 4-digit code kept (salted + hashed) on this device. It locks the app on start and after it was in the background a while.
async function sha256hex(text) {
  if (window.crypto && crypto.subtle) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  // Plain-http LAN pages have no crypto.subtle: fall back to a small FNV-based digest (still never stores the code itself).
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (const ch of text) { const c = ch.charCodeAt(0); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 + c, 2246822519) >>> 0; }
  return h1.toString(16) + h2.toString(16);
}
const lockEnabled = () => !!store.get('pass', null);
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now();
  else if (lockEnabled() && hiddenAt && Date.now() - hiddenAt > (S.settings.lockAfter || 60) * 1000) showLock();
});
function pinPad(title, onDone) {
  const L = $('#lock');
  let code = '';
  L.innerHTML = `<div class="auth-hero" style="background:rgba(255,255,255,.18);box-shadow:none;margin:0">${icon('lock')}</div>
    <div style="font-size:19px;font-weight:700" class="lt">${esc(title)}</div><div class="dots">${'<i></i>'.repeat(4)}</div>
    <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k) => k === '' ? '<span></span>' : `<button data-k="${k}">${k}</button>`).join('')}</div>`;
  L.classList.remove('hidden');
  const dots = L.querySelectorAll('.dots i');
  const paint = () => dots.forEach((d, i) => d.classList.toggle('f', i < code.length));
  const press = async (k) => {
    if (k === '⌫') code = code.slice(0, -1); else if (code.length < 4) code += k;
    paint();
    if (code.length === 4) { const c = code; code = ''; const ok = await onDone(c); if (ok === false) { const d = L.querySelector('.dots'); d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); setTimeout(paint, 300); if (navigator.vibrate) try { navigator.vibrate(80); } catch { } } else paint(); }
  };
  L.onclick = (e) => { const b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); };
  L.onkeydown = null;
  document.onkeydown = (e) => { if (L.classList.contains('hidden')) return; if (/^\d$/.test(e.key)) press(e.key); if (e.key === 'Backspace') press('⌫'); };
  return L;
}
function showLock() {
  const p = store.get('pass', null); if (!p) return;
  pinPad('Enter your passcode', async (c) => {
    if (await sha256hex(p.salt + c) !== p.hash) return false;
    $('#lock').classList.add('hidden'); return true;
  });
}
function setupPasscode(after) {
  let first = null;
  const L = pinPad('Choose a 4-digit passcode', async (c) => {
    if (!first) { first = c; L.querySelector('.lt').textContent = 'Repeat the passcode'; return true; }
    if (c !== first) { first = null; L.querySelector('.lt').textContent = "Didn't match. Choose a passcode"; return false; }
    const salt = Math.random().toString(36).slice(2);
    store.set('pass', { salt, hash: await sha256hex(salt + c) });
    L.classList.add('hidden'); toast('Passcode lock is on'); after && after(); return true;
  });
  const cancel = h(`<button style="position:absolute;top:calc(16px + env(safe-area-inset-top));right:16px;color:#fff;font-weight:600">Cancel</button>`);
  cancel.onclick = () => L.classList.add('hidden');
  L.appendChild(cancel);
}

// Hooks for the Android app shell
window.sgBack = () => { if (!$('#lock').classList.contains('hidden')) return false; if (stack.length) { back(); return true; } return false; };
window.sgOpen = (aid, chatId) => {
  const go = () => { if (acc(aid) && aid !== S.aid) switchAccount(aid); closeAll(() => { const t = () => (dialogsOf(aid) ? openChat(chatId) : setTimeout(t, 300)); t(); }); };
  if (S.accounts.length) go(); else setTimeout(() => window.sgOpen(aid, chatId), 500);
};

init();
