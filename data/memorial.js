/* =========================================================
   MEMORIAL HONORS — 추모 아카이브

   ⚠ 두 개의 필수 필드가 모두 통과해야 화면에 나옵니다.

     familyConsent : true / false   ← false 면 어떤 정보도 노출되지 않습니다
     visibility    : "public"   성함 그대로
                     "initial"  홍○○ 형태로 자동 마스킹
                     "private"  성함을 가리고 회원번호와 연도만

   사진은 유족이 제공한 것만 사용하며 화면에서 흑백으로 처리됩니다.
   ========================================================= */
HONOR.memorial = {
  lead: "먼저 떠나신 회원들의 이름을 이곳에 모십니다. 나눔은 그분들이 남긴 가장 오래 남는 문장입니다.",
  emptyMessage: "유족의 동의를 받아 모신 기록이 준비되는 대로 이곳에 실립니다.",

  /* 헌화 기능 사용 여부 — true 면 방문자가 헌화할 수 있습니다.
     헌화 수는 이 컴퓨터(브라우저)에만 저장됩니다. */
  flowersEnabled: true,

  list: [
    // {
    //   familyConsent: true,
    //   consentDate: "2026-05-02",
    //   no: 37,                       // 회원번호
    //   name: "홍길동",
    //   visibility: "initial",        // public | initial | private
    //   joinedYear: 2014,
    //   passedYear: 2025,
    //   epitaph: "받은 것을 돌려놓고 간다고 하셨습니다.",
    //   photo: "assets/img/memorial/hong.jpg",   // 유족 제공분만
    //   flowers: 0,
    //   tributes: [
    //     { by: "담당자", text: "매년 겨울마다 먼저 전화를 주셨습니다." }
    //   ]
    // }
  ]
};
