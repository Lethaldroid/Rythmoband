// const time = ;
export const projectList = [
  { name: "Christmas Eve", date: new Date(2023, 3, 21) },
  { name: "London Trip", date: new Date(2023, 3, 1) },
  { name: "David's Birthday", date: new Date(2023, 3, 18) },
  { name: "Nobody's Birthday", date: new Date(Date.now()) },
  { name: "Nobody's Birthday", date: new Date(Date.now()) },
  { name: "Nobody's Birthday", date: new Date(Date.now()) },
  { name: "Nobody's Birthday", date: new Date(Date.now()) },
];

export const parseDate = (date) => {
  return new Date(date).toLocaleString().split(",")[0];
};
