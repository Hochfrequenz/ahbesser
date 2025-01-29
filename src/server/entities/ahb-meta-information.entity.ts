import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity({ name: 'ahbmetainformation', synchronize: false })
export class AhbMetaInformation {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id!: string;

  @Column({ type: 'varchar', length: 7 })
  @Index('ix_ahbmetainformation_edifact_format')
  edifact_format!: string;

  @Column({ type: 'varchar', length: 6 })
  @Index('ix_ahbmetainformation_edifact_format_version')
  edifact_format_version!: string;

  @Column({ type: 'varchar' })
  @Index('ix_ahbmetainformation_pruefidentifikator')
  pruefidentifikator!: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  direction?: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  ahb_id?: string;
}
