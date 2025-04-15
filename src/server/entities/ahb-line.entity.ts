// The here defined columns come from the ahbline table in the database.
// The table is created by the ahbline.sql file in the database/sql folder.
// Which you can find here: https://github.com/Hochfrequenz/ahb-mig-backend/releases/tag/v0.0.1

import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity({ name: 'v_ahbtabellen', synchronize: false })
export class AhbLine {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id!: string;

  @Column({ type: 'varchar' })
  format_version!: string;

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
  sort_path?: string;
}
