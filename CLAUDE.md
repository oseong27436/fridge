# 냉장고 앱 (Fridge)

## 프로젝트 개요
내 냉장고 속 음식을 시각적으로 관리하는 웹앱.
실제 냉장고처럼 생긴 UI에 현재 보유 중인 음식 이미지를 배치해서 보여줌.
식단 관리 중이라 음식 종류가 한정적 → 음식별 이미지를 미리 등록해두고 사용.

## 기술 스택
- **Framework**: Next.js 14 (App Router)
- **Style**: Tailwind CSS
- **DB / Auth**: Supabase
- **Deploy**: Vercel
- **Language**: TypeScript

## 기능 스펙
- 냉장칸 / 냉동칸 구분된 냉장고 UI
- 등록된 음식 이미지를 DB 데이터에 맞게 시각적으로 배치
- + 버튼 → 음식 목록 팝업 → 선택하면 냉장고에 추가
- 음식 클릭 → 수량 조절 or 제거
- 음식 마스터 데이터 (이름, 이미지, 냉장/냉동 여부) 사전 등록

## 디자인 방향
- AI 느낌 X (보라/파랑 그라데이션, 카드 UI 지양)
- 레트로 팝아트 / 플랫 일러스트 무드
- 굵은 압축 폰트, 플랫 컬러, 만화적 느낌

## DB 구조 (예정)
- `food_items` - 음식 마스터 (id, name, image_url, storage_type: fridge|freezer)
- `fridge_contents` - 현재 냉장고 상태 (food_item_id, quantity, added_at)

## 향후 계획
- 포털(Oseong Hub)에 통합 예정
- 안정화 후 Expo(React Native) 앱으로 마이그레이션
