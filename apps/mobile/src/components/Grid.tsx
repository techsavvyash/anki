import React from 'react';
import { View, ViewStyle } from 'react-native';
import { IS_TABLET } from '../utils/responsive';

interface GridProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactElement;
  numColumns?: number;
  gap?: number;
  style?: ViewStyle;
}

export const Grid: React.FC<GridProps> = ({
  data,
  renderItem,
  numColumns = IS_TABLET ? 2 : 1,
  gap = 12,
  style,
}) => {
  const rows: any[][] = [];
  for (let i = 0; i < data.length; i += numColumns) {
    rows.push(data.slice(i, i + numColumns));
  }

  return (
    <View style={style}>
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: 'row',
            marginBottom: gap,
            gap: gap,
          }}
        >
          {row.map((item, colIndex) => (
            <View
              key={colIndex}
              style={{
                flex: 1,
              }}
            >
              {renderItem(item, rowIndex * numColumns + colIndex)}
            </View>
          ))}
          {/* Fill empty columns */}
          {row.length < numColumns &&
            Array.from({ length: numColumns - row.length }).map((_, i) => (
              <View key={`empty-${i}`} style={{ flex: 1 }} />
            ))}
        </View>
      ))}
    </View>
  );
};
