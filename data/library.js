/* =========================================================
   library.js — 복지동향
   아너 소사이어티 기부 뉴스만 모읍니다.
   제목을 누르면 원문 보도자료가 새 창으로 열립니다.

   항목 형식
     date   "YYYY-MM-DD"
     media  언론사
     title  기사 제목
     url    원문 링크
     scope  "전국" | "울산"
     member 기사에 실명이 이미 공개된 경우만 (선택)
   ========================================================= */
HONOR.news = {
  note: "제목을 누르면 원문이 새 창에서 열립니다. 기사에 이미 실명이 공개된 경우에만 회원명을 적습니다.",
  emptyMessage: "조건에 맞는 기사가 없습니다.",

  items: [
    { date: "2026-02-18", media: "울산신문", scope: "울산", topic: "클럽 활동",
      title: "울산 아너 소사이어티클럽, 회원 50명 교류 시간",
      memo: "울산 클럽 규모를 숫자로 보여줄 때 쓰기 좋은 기사. “혼자 하는 기부가 아니다”를 설명할 근거.",
      pull: "회원 50명이 한자리에",
      url: "https://www.ulsanpress.net/news/articleView.html?idxno=583210" },

    { date: "2025-12-05", media: "울주신문", scope: "울산", topic: "총회",
      title: "따뜻한 울산, 사회복지공동모금회 아너소사이어티클럽 총회",
      memo: "연 1회 총회가 실제로 열린다는 증거. 가입 후 무엇이 있는지 물을 때 함께 제시.",
      pull: "울산 클럽 정기 총회",
      url: "http://www.ujnews.co.kr/news/articleView.html?idxno=245122" },

    { date: "2025-11-10", media: "헤럴드K", scope: "전국", topic: "회원의 날",
      title: "사랑의열매 억대기부자 3,759명… 아너 소사이어티의 날, 보람찬 회합",
      memo: "전국 규모를 한 줄로 보여주는 기사. 첫 상담에서 제도의 무게를 전할 때.",
      pull: "억대 기부자 3,759명",
      url: "https://www.heraldk.com/article/2025111021082040014" },

    { date: "2025-09-12", media: "울주신문", scope: "울산", topic: "멤버스데이",
      title: "울산 아너 소사이어티 클럽, 멤버스데이 개최",
      memo: "예우 프로그램이 문서상 약속이 아니라 실제 행사라는 점을 보여줄 때.",
      pull: "울산 멤버스데이",
      url: "https://ujnews.co.kr/news/newsview.php?ncode=1065565671416503" },

    { date: "2024-10-03", media: "경북매일", scope: "전국", topic: "가입 사례",
      title: "아너 소사이어티 가입 — 5년 내 1억원 기부 약정",
      memo: "5년 약정 방식의 실제 가입 사례. “한 번에 1억은 어렵다”는 분께 보여줄 기사.",
      pull: "5년 내 1억원 약정",
      url: "https://kbmaeil.com/article/202410030406919" },

    { date: "2022-11-23", media: "한경비즈니스", scope: "전국", topic: "연혁",
      title: "1억원 이상 기부한 아너 소사이어티 회원들… 출범 후 15년 만에 ‘대기록’",
      memo: "제도의 역사와 축적을 설명할 때. 걸어온 길 섹션과 함께 쓰면 좋음.",
      pull: "출범 15년의 기록",
      url: "https://magazine.hankyung.com/business/article/202211230316b" }
  ]
};

/* 서식은 상담 데스크에서 바로 꺼내 씁니다 */
HONOR.forms = {
  note: "파일을 assets/files/ 에 넣고 ready 를 true 로 바꾸면 내려받기가 열립니다.",
  items: [
    { title: "아너 소사이어티 가입 약정서", type: "PDF",
      desc: "가입 의사와 납입 방식을 적는 기본 서식.",
      file: "assets/files/honor-agreement.pdf", ready: false },
    { title: "지정기탁 신청 서식", type: "PDF",
      desc: "배분 분야나 기관을 지정할 때 함께 작성.",
      file: "assets/files/designated-giving.pdf", ready: false },
    { title: "아너 소사이어티 안내 리플릿", type: "PDF",
      desc: "제도 전반을 한 장으로. 첫 상담에 전달.",
      file: "assets/files/honor-leaflet.pdf", ready: false },
    { title: "유산기부 안내서", type: "PDF",
      desc: "유언 기부와 상속 재산 기부 절차.",
      file: "assets/files/legacy-guide.pdf", ready: false },
    { title: "약정 변경 신청서", type: "PDF",
      desc: "납입 일정·금액·공개 여부를 바꿀 때.",
      file: "assets/files/change-request.pdf", ready: false }
  ]
};
