// The here defined columns come from the ahbline table in the database.
// The table is created by the ahbline.sql file in the database/sql folder.
// Which you can find here: https://github.com/Hochfrequenz/xml-fundamend-python/blob/main/src/fundamend/sqlmodels/create_ahbtabellen_view.sql
// The related SQLModel can by found here: https://github.com/Hochfrequenz/xml-fundamend-python/blob/9a45e07f953d42c707db4c7af4294790f26e01ce/src/fundamend/sqlmodels/ahbtabellen_view.py#L37-L60

import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'anwendungshandbuch', synchronize: false })
export class Anwendungshandbuch {
  // original structure: https://github.com/Hochfrequenz/xml-fundamend-python/blob/f94fbe2bf228f30fc4919abc47d5edc4dd1e3ea5/src/fundamend/sqlmodels/anwendungshandbuch.py#L464-L512
  @PrimaryColumn({ type: 'varchar', length: 32 })
  primary_key!: string;
  // we omit the other columns as they are not relevant to use right now
  @Column({ type: 'varchar', nullable: true })
  edifact_format_version?: string;
}
@Entity({ name: 'v_ahbtabellen', synchronize: false })
export class AhbLine {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id!: string;

  @Column({ type: 'varchar' })
  format_version!: string;

  @Column({ type: 'varchar' })
  format!: string;

  @Column({ type: 'varchar' })
  pruefidentifikator!: string;

  @Column({ type: 'varchar', nullable: true })
  path?: string;

  @Column({ type: 'varchar', nullable: true })
  id_path?: string;

  @Column({ type: 'varchar', nullable: true })
  direction?: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  segmentgroup_key?: string;

  @Column({ type: 'varchar', nullable: true })
  segment_code?: string;

  @Column({ type: 'varchar', nullable: true })
  data_element?: string;

  @Column({ type: 'varchar', nullable: true })
  qualifier?: string;

  @Column({ type: 'varchar', nullable: true })
  line_ahb_status?: string;

  @Column({ type: 'varchar', nullable: true })
  line_name?: string;

  @Column({ type: 'varchar', nullable: true })
  line_type?: string;

  @Column({ type: 'varchar', nullable: true })
  sort_path?: string;

  @Column({ type: 'varchar', nullable: true })
  bedingung?: string;

  @Column({ type: 'varchar', nullable: true })
  bedingungsfehler?: string;
}
