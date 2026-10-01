/* 자료실 — 약정서, 지정기탁 서식, 안내 리플릿
   file 에 적은 경로에 실제 파일을 넣어야 내려받기가 동작합니다.
   파일이 아직 없으면 ready:false 로 두세요. 화면에 "준비 중"으로 표시됩니다. */
HONOR.downloads = {
  note: "서식은 담당자 상담 후 작성하셔도 됩니다. 미리 보시기만 해도 괜찮습니다.",
  list: [
    { title: "아너 소사이어티 가입 약정서", type: "PDF",
      desc: "가입 의사와 납입 방식을 적는 기본 서식입니다.",
      file: "assets/files/honor-agreement.pdf", ready: false },

    { title: "지정기탁 신청 서식", type: "PDF",
      desc: "배분 분야나 기관을 지정하실 때 함께 작성합니다.",
      file: "assets/files/designated-giving.pdf", ready: false },

    { title: "아너 소사이어티 안내 리플릿", type: "PDF",
      desc: "제도 전반을 한 장으로 정리한 자료입니다.",
      file: "assets/files/honor-leaflet.pdf", ready: false },

    { title: "유산기부 안내서", type: "PDF",
      desc: "유언 기부와 상속 재산 기부 절차를 담았습니다.",
      file: "assets/files/legacy-guide.pdf", ready: false }
  ]
};
