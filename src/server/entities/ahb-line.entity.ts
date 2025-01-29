import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity({ name: 'ahbline', synchronize: false })
export class AhbLine {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id!: string;

  @Column({ type: 'integer' })
  @Index('ix_ahbline_position_inside_ahb')
  position_inside_ahb!: number;

  @Column({ type: 'varchar', nullable: true })
  segment_group_key?: string;

  @Column({ type: 'varchar', nullable: true })
  segment_code?: string;

  @Column({ type: 'varchar', nullable: true })
  data_element?: string;

  @Column({ type: 'varchar', nullable: true })
  segment_id?: string;

  @Column({ type: 'varchar', nullable: true })
  value_pool_entry?: string;

  @Column({ type: 'varchar', nullable: true })
  name?: string;

  @Column({ type: 'varchar', nullable: true })
  ahb_expression?: string;

  @Column({ type: 'varchar', nullable: true })
  conditions?: string;

  @Column({ type: 'varchar', nullable: true })
  section_name?: string;

  @Column({ type: 'integer', nullable: true })
  index?: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  ahb_id?: string;
}
