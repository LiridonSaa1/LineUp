# Implementation Plan - Enhanced Home Experience & Animations

Restructure the Home screen with a new discovery-focused layout, add an auto-playing barbershop slider, and implement smooth "pop-in" animations for a premium feel.

## Proposed Changes

### [HomeScreen.tsx](file:///C:/Users/lirid/OneDrive/Desktop/LineUp/artifacts/web/rn-app/src/screens/HomeScreen.tsx)

1.  **Auto-Play Barbershop Slider**:
    - Fetch top 10 active barbershops from Supabase.
    - Create a `ShopSlider` component that automatically scrolls every 4 seconds.
    - **Design**: Card with full-bleed image and an elegant overlay for name/rating.

2.  **Renditja e Re (New Order)**:
    1.  **Header**: Search & User info.
    2.  **Sallonet e Sugjeruara**: The new auto-play slider.
    3.  **Ofertat Speciale**: Reklama label and ads slider.
    4.  **Si të përdoret**: Educational 3-step guide.
    5.  **Barberët Top 10**: Horizontal slider of top talent.
    6.  **Planet**: Business pricing section.

3.  **"Light & Beautiful" Animations**:
    - Use `FadeInUp` from `react-native-reanimated` for each section.
    - Apply staggered delays (e.g., 200ms, 400ms, 600ms) so elements "flow" into view as the user scrolls or opens the page.
    - Add a subtle parallax effect or scale transition to cards for better tactile feel.

## Verification Plan

### Manual Verification
- **Slider**: Ensure the shops scroll automatically without user interaction.
- **Order**: Confirm the screen follows the new logical sequence (Discovery -> Value -> Trust).
- **Animations**: Verify that sections fade in smoothly as the screen loads.
- **Performance**: Ensure no lag during auto-scroll or layout transitions.
