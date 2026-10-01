/* 울산 기록관 + 명패 월
   ⚠ verified:false 인 동안 화면에 "검증 전 임시 수치" 안내가 표시됩니다. */
HONOR.ulsan = {
  verified: false,
  asOf: "2025년 12월 31일 기준",
  note: "울산 누적 회원 수(138명)는 언론 보도 수치입니다. 연도별 분해값과 약정 금액은 내부 자료로 교체가 필요한 임시값입니다.",
  rows: [
    { year: 2016, members:  52, newMembers:  7, amount:  7.0 },
    { year: 2017, members:  61, newMembers:  9, amount:  9.0 },
    { year: 2018, members:  73, newMembers: 12, amount: 12.0 },
    { year: 2019, members:  85, newMembers: 12, amount: 12.5 },
    { year: 2020, members:  94, newMembers:  9, amount:  9.0 },
    { year: 2021, members: 104, newMembers: 10, amount: 10.5 },
    { year: 2022, members: 115, newMembers: 11, amount: 11.0 },
    { year: 2023, members: 124, newMembers:  9, amount:  9.5 },
    { year: 2024, members: 132, newMembers:  8, amount:  8.0 },
    { year: 2025, members: 138, newMembers:  6, amount:  6.0 }
  ]
};

/* 명패 월 — 기부자 본인의 공개 동의를 받은 경우에만 name 을 적습니다. */
HONOR.wall = {
  autoFill: true,
  note: "기부자 본인의 공개 동의를 받은 명패만 성함이 표시됩니다. 비공개를 선택하신 분은 호수와 가입 연도만 기록됩니다.",
  plates: [
    // { no: 1, year: 2011, name: "홍길동" },
    // { no: 2, year: 2012 },
  ]
};
