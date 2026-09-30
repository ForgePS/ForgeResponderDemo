import PageHeader from '@views/forge-responder/PageHeader'
import RmsMasterDataManager from '@views/forge-responder/RmsMasterDataManager'

export default function MasterDataPage() {
  return (
    <div>
      <PageHeader
        title='RMS Master Data'
        description='Manage stations, shifts, apparatus, and units through the Forge Platform integration layer.'
      />
      <RmsMasterDataManager />
    </div>
  )
}
