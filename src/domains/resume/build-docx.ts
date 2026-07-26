import { Document, Packer, Paragraph } from 'docx'

export async function buildDocx(text: string): Promise<Buffer> {
  const document = new Document({
    sections: [{ children: text.split(/\r?\n/).map(line => new Paragraph(line)) }],
  })

  return Packer.toBuffer(document)
}
