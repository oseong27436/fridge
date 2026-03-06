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
- + 버튼 → 팝업 (기존 food_items 목록 + "새 음식 등록" 버튼)
  - 기존 음식 선택 → fridge_contents 수량 +1 (없으면 INSERT, 있으면 UPDATE)
  - 새 음식 등록 → 이름 + 보관타입 + PNG 업로드(Supabase Storage) → food_items INSERT → fridge_contents INSERT
- 음식 클릭 → 수량 조절 or 제거
- 음식 마스터 데이터 (이름, 이미지, 냉장/냉동 여부) 사전 등록

## 디자인 방향
- 실제 냉장고 내부 사진을 배경으로 사용
- 선반 위치에 맞게 음식 이미지를 absolute로 오버레이
- 냉장고 이미지: be28ba70347f2d8c889889ade107705d.jpg (Supabase Storage 업로드 예정)

## DB 구조
- `food_items` - 음식 마스터 (id, name, description, image_url, storage_type: fridge|freezer|room_temp, created_at)
- `fridge_contents` - 현재 냉장고 상태 (id, food_item_id, quantity, added_at, updated_at)
  - quantity는 개수(integer), description에 "1개 = 60g" 같은 단위 메모
  - fridge_contents는 현재 상태만 관리 (이력 X), 먹으면 UPDATE

## 향후 계획
- 포털(Oseong Hub)에 통합 예정
- 안정화 후 Expo(React Native) 앱으로 마이그레이션
