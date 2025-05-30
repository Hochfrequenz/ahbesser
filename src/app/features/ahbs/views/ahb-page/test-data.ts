import { Observable, delay, map, of } from 'rxjs';
import { Ahb } from '../../../../core/api';

export const testData$: Observable<Ahb> = of(null).pipe(
  delay(1000),
  map(() => ({
    meta: {
      description: 'asd',
      direction: 'LTS to abc',
      pruefidentifikator: '123',
    },
    lines: [
      {
        index: 0,
        ahb_expression: 'maxim',
        data_element: 'data_element',
        guid: 'guid',
        name: 'name',
        section_name: 'section_name',
        segment_code: 'segment_code',
        segment_group_key: 'segment_group_key',
        value_pool_entry: 'value_pool_entry',
      },
      {
        index: 0,
        ahb_expression: 'ahb_expression',
        data_element: 'data_element',
        guid: 'guid',
        name: 'name',
        section_name: 'section_name',
        segment_code: 'segment_code',
        segment_group_key: 'segment_group_key',
        value_pool_entry: 'value_pool_entry',
      },
      {
        index: 0,
        ahb_expression: 'ahb_expression',
        data_element: 'data_element',
        guid: 'guid',
        name: 'name',
        section_name: 'section_name',
        segment_code: 'segment_code',
        segment_group_key: 'segment_group_key',
        value_pool_entry: 'value_pool_entry',
      },
      {
        index: 0,
        ahb_expression: 'ahb_expression',
        data_element: 'data_element',
        guid: 'guid',
        name: 'name',
        section_name: 'section_name',
        segment_code: 'segment_code',
        segment_group_key: 'segment_group_key',
        value_pool_entry: 'value_pool_entry',
      },
      {
        index: 0,
        ahb_expression: 'ahb_expression',
        data_element: 'data_element',
        guid: 'guid',
        name: 'name',
        section_name: 'section_name',
        segment_code: 'segment_code',
        segment_group_key: 'segment_group_key',
        value_pool_entry: 'value_pool_entry',
      },
      {
        index: 0,
        ahb_expression: 'ahb_expression',
        data_element: 'data_element',
        guid: 'guid',
        name: 'name',
        section_name: 'section_name',
        segment_code: 'segment_code',
        segment_group_key: 'segment_group_key',
        value_pool_entry: 'value_pool_entry',
      },
      {
        index: 0,
        ahb_expression: 'ahb_expression',
        data_element: 'data_element',
        guid: 'guid',
        name: 'name',
        section_name: 'section_name',
        segment_code: 'segment_code',
        segment_group_key: 'segment_group_key',
        value_pool_entry: 'value_pool_entry',
      },
    ],
  }))
);
