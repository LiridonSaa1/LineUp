# Register: Redesigned Category Selection

The current "chip" layout for categories feels cluttered. This plan proposes a more structured and modern grid-based approach using small service cards.

## User Review Required

> [!TIP]
> **New Design**: I will switch from small horizontal tags to a **3-column grid of vertical cards**. Each card will have a larger icon on top and the label below. This matches the style of high-end booking apps like Treatwell or Fresha.

## Proposed Changes

### [Register Screen UI]

#### [MODIFY] [RegisterScreen.tsx](file:///C:/Users/lirid/OneDrive/Desktop/LineUp/artifacts/web/rn-app/src/screens/RegisterScreen.tsx)
- Replace the `flex-wrap` container with a structured `View` using `flex-row` and `flex-wrap: wrap`.
- Each category item will now be an `ItemCard`:
    - Width: ~31% (to fit 3 in a row with gaps).
    - Height: Fixed (e.g., 90px).
    - Alignment: Centered (Icon on top, Text at bottom).
- **Interactive States**:
    - **Unselected**: White background, grey icon/text, subtle border.
    - **Selected**: Light blue background (`#3473ef/10`), blue border (`#3473ef`), blue icon/text.

## Verification Plan

### Manual Verification
1.  **Visual Check**: Open the Register form. Verify that categories are neatly aligned in 3 columns.
2.  **Responsiveness**: Check how it looks on different screen widths (the 31% width should handle this).
3.  **Functionality**: Tap multiple cards. Verify the selection logic still works perfectly.
