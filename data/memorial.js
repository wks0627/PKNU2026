window.HONOR = window.HONOR || {};
/* =========================================================
   MEMORIAL HONORS — 아너 추모 공간

   ⚠ 두 개의 필수 조건이 모두 통과해야 화면에 나옵니다.

     familyConsent : true / false   ← false 면 어떤 정보도 노출되지 않습니다
     visibility    : "public"   성함 그대로
                     "initial"  홍○○ 형태로 자동 마스킹
                     "private"  성함을 가리고 호수와 연도만

   사진은 유족이 제공한 것만 사용하며 화면에서 흑백으로 처리됩니다.
   사진이 없으면 명예의전당 이미지가 명패 배경으로 들어갑니다.
   ========================================================= */
HONOR.memorial = {
  lead: "먼저 떠나신 회원들의 이름을 이곳에 모십니다. 나눔은 그분들이 남긴 가장 오래 남는 문장입니다.",
  emptyMessage: "유족의 동의를 받아 모신 기록이 준비되는 대로 이곳에 실립니다.",
  placeholder: "assets/img/hall.jpg",

  /* 명예의전당과 같은 1호~150호 체계를 씁니다.
     명패는 은빛(silver)으로 구분합니다. */
  total: 150,

  /* 헌화 — 누른 사람의 브라우저에만 저장됩니다 (여러 사람의 합계가 아닙니다) */
  flowersEnabled: true,
  flowerNote: "헌화 기록은 이 컴퓨터에만 저장됩니다. 여러 사람의 합계를 모으려면 별도의 서버가 필요합니다.",

  list: [
    // {
    //   familyConsent: true,
    //   consentDate: "2026-05-02",
    //   no: 37,
    //   name: "홍길동",
    //   visibility: "initial",         // public | initial | private
    //   joinedYear: 2014,
    //   passedYear: 2025,
    //   epitaph: "받은 것을 돌려놓고 간다고 하셨습니다.",
    //   photo: "assets/img/memorial/037.jpg",
    //   flowers: 0,
    //   tributes: [
    //     { by: "담당자", text: "매년 겨울마다 먼저 전화를 주셨습니다." }
    //   ]
    // }
  ]
};
