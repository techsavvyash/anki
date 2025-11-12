import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { Grid } from '../Grid';

// Mock responsive module
jest.mock('../../utils/responsive', () => ({
  IS_TABLET: false,
}));

describe('Grid Component', () => {
  const mockData = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
    { id: 4, name: 'Item 4' },
    { id: 5, name: 'Item 5' },
  ];

  const mockRenderItem = (item: any) => (
    <View testID={`item-${item.id}`}>
      <Text>{item.name}</Text>
    </View>
  );

  it('should render all items', () => {
    const { getByTestId } = render(
      <Grid data={mockData} renderItem={mockRenderItem} />
    );

    mockData.forEach((item) => {
      expect(getByTestId(`item-${item.id}`)).toBeTruthy();
    });
  });

  it('should render items in single column by default on phone', () => {
    const { UNSAFE_getAllByType } = render(
      <Grid data={mockData} renderItem={mockRenderItem} />
    );

    // Should have 5 rows (one per item) on phone
    const rows = UNSAFE_getAllByType(View).filter(
      (node) => node.props.style?.flexDirection === 'row'
    );
    expect(rows.length).toBe(5);
  });

  it('should render items in 2 columns when specified', () => {
    const { UNSAFE_getAllByType } = render(
      <Grid data={mockData} renderItem={mockRenderItem} numColumns={2} />
    );

    // With 5 items and 2 columns, should have 3 rows
    const rows = UNSAFE_getAllByType(View).filter(
      (node) => node.props.style?.flexDirection === 'row'
    );
    expect(rows.length).toBe(3);
  });

  it('should render items in 3 columns when specified', () => {
    const { UNSAFE_getAllByType } = render(
      <Grid data={mockData} renderItem={mockRenderItem} numColumns={3} />
    );

    // With 5 items and 3 columns, should have 2 rows
    const rows = UNSAFE_getAllByType(View).filter(
      (node) => node.props.style?.flexDirection === 'row'
    );
    expect(rows.length).toBe(2);
  });

  it('should apply custom gap', () => {
    const customGap = 20;
    const { UNSAFE_getAllByType } = render(
      <Grid data={mockData} renderItem={mockRenderItem} gap={customGap} />
    );

    const rows = UNSAFE_getAllByType(View).filter(
      (node) => node.props.style?.flexDirection === 'row'
    );

    rows.forEach((row) => {
      expect(row.props.style.marginBottom).toBe(customGap);
      expect(row.props.style.gap).toBe(customGap);
    });
  });

  it('should apply custom style to container', () => {
    const customStyle = { backgroundColor: 'red', padding: 10 };
    const { UNSAFE_getByType } = render(
      <Grid data={mockData} renderItem={mockRenderItem} style={customStyle} />
    );

    const container = UNSAFE_getByType(View);
    expect(container.props.style).toEqual(customStyle);
  });

  it('should handle empty data array', () => {
    const { UNSAFE_queryAllByType } = render(
      <Grid data={[]} renderItem={mockRenderItem} />
    );

    const rows = UNSAFE_queryAllByType(View).filter(
      (node) => node.props.style?.flexDirection === 'row'
    );
    expect(rows.length).toBe(0);
  });

  it('should fill empty columns in last row', () => {
    const threeItems = mockData.slice(0, 3);
    const { UNSAFE_getAllByType } = render(
      <Grid data={threeItems} renderItem={mockRenderItem} numColumns={2} />
    );

    // With 3 items and 2 columns, last row has 1 item and 1 empty cell
    const rows = UNSAFE_getAllByType(View).filter(
      (node) => node.props.style?.flexDirection === 'row'
    );

    // Last row should have 2 children (1 item + 1 empty)
    const lastRow = rows[rows.length - 1];
    expect(lastRow.props.children.length).toBe(2);
  });

  it('should pass correct index to renderItem', () => {
    const renderSpy = jest.fn((item, index) => (
      <View testID={`item-${index}`}>
        <Text>{item.name}</Text>
      </View>
    ));

    render(<Grid data={mockData} renderItem={renderSpy} numColumns={2} />);

    // Verify renderItem was called with correct indices
    expect(renderSpy).toHaveBeenCalledTimes(5);
    expect(renderSpy).toHaveBeenNthCalledWith(1, mockData[0], 0);
    expect(renderSpy).toHaveBeenNthCalledWith(2, mockData[1], 1);
    expect(renderSpy).toHaveBeenNthCalledWith(3, mockData[2], 2);
    expect(renderSpy).toHaveBeenNthCalledWith(4, mockData[3], 3);
    expect(renderSpy).toHaveBeenNthCalledWith(5, mockData[4], 4);
  });

  it('should handle single item', () => {
    const singleItem = [mockData[0]];
    const { getByTestId } = render(
      <Grid data={singleItem} renderItem={mockRenderItem} numColumns={3} />
    );

    expect(getByTestId(`item-${singleItem[0].id}`)).toBeTruthy();
  });

  it('should render exactly matching columns', () => {
    const fourItems = mockData.slice(0, 4);
    const { UNSAFE_getAllByType } = render(
      <Grid data={fourItems} renderItem={mockRenderItem} numColumns={2} />
    );

    // With 4 items and 2 columns, should have exactly 2 rows with no empty cells
    const rows = UNSAFE_getAllByType(View).filter(
      (node) => node.props.style?.flexDirection === 'row'
    );
    expect(rows.length).toBe(2);
  });
});
