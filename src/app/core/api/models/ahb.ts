/* tslint:disable */
 
export interface Ahb {
  lines: Array<{
'ahb_expression': string;
'conditions'?: string;
'data_element': string;
'guid': string;
'index': number;
'name': string;
'section_name': string;
'segment_code': string;
'segment_group_key': string;
'value_pool_entry': string;
}>;
  meta: {
'description': string;
'direction': string;
'maus_version': string;
'pruefidentifikator': string;
};
}
