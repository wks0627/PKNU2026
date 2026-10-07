/* =========================================================
   stats.js — 현황 수치
   상담에서 인용하는 숫자는 전부 여기 한 곳에 둡니다.

   ⚠ verified:false 인 항목은 화면에 "검증 전 임시 수치" 경고가 붙습니다.
     내부 자료로 교체한 뒤 true 로 바꾸세요.
   ========================================================= */

/* 전국 — 사랑의열매 공개 자료 */
HONOR.national = {
  verified: true,
  asOf: "2025년 12월 31일 기준",
  source: "사랑의열매 사회복지공동모금회 누리집 공개 자료",
  figures: [
    { value: "3,848", unit: "명",   label: "전국 누적 회원" },
    { value: "4,343", unit: "억원", label: "누적 약정 금액" },
    { value: "18",    unit: "개",   label: "전국 지역 클럽" },
    { value: "2007",  unit: "년",   label: "출범 (국내 최초)" }
  ]
};

/* 울산 — 연도별 */
HONOR.ulsan = {
  verified: false,
  asOf: "2026년 기준 (2026년 신규 5명)",
  note: "울산 누적 회원 수(2025년 138명)는 언론 보도 수치이고 2026년 신규 5명은 담당자 집계입니다. 연도별 분해값과 약정 금액은 내부 자료로 교체가 필요한 임시값입니다.",
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
    { year: 2025, members: 138, newMembers:  6, amount:  6.0 },
    { year: 2026, members: 143, newMembers:  5, amount:  5.0 }
  ]
};

/* 배분 — "내 돈이 어디 가느냐"는 질문에 쓰는 자료 */
HONOR.distribution = {
  verified: false,
  asOf: "2025년 12월 31일 기준",
  note: "배분 수치는 내부 자료로 교체가 필요한 임시값입니다.",
  byYear: [
    { year: 2021, amount: 118.0, orgs: 142 },
    { year: 2022, amount: 126.5, orgs: 151 },
    { year: 2023, amount: 131.2, orgs: 158 },
    { year: 2024, amount: 139.8, orgs: 166 },
    { year: 2025, amount: 147.4, orgs: 173 }
  ],
  fields: [
    { name: "아동·청소년",   pct: 28 },
    { name: "노인",          pct: 22 },
    { name: "장애인",        pct: 18 },
    { name: "위기가정·긴급", pct: 17 },
    { name: "지역사회 돌봄", pct: 15 }
  ],
  programs: [
    { title: "위기가정 긴급지원", field: "위기가정·긴급",
      target: "갑작스러운 실직·질병으로 생계가 끊긴 가구",
      body: "심사 기간을 최소화해 신청 후 빠르게 생계비와 의료비를 지원합니다." },
    { title: "아동 결식 예방", field: "아동·청소년",
      target: "방과 후 끼니를 거르는 아동",
      body: "지역 아동센터와 연계해 급식과 돌봄을 함께 지원합니다." },
    { title: "독거노인 안부 돌봄", field: "노인",
      target: "홀로 지내는 어르신",
      body: "정기 방문과 안부 확인, 겨울철 난방비를 지원합니다." },
    { title: "장애인 자립 지원", field: "장애인",
      target: "자립을 준비하는 장애인 당사자",
      body: "주거 환경 개선과 보조기기 구입, 직업 훈련을 지원합니다." }
  ],
  orgs: { total: 173, note: "기관명은 각 기관의 공개 동의를 받은 곳만 게시합니다." }
};
