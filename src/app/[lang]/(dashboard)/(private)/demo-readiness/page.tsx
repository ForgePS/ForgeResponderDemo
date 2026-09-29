import PageHeader from '@views/forge-responder/PageHeader'
import DemoPreflight from '@views/forge-responder/DemoPreflight'

export default function DemoReadinessPage(){
  return <div>
    <PageHeader title='Demo Readiness' description='Pre-show system checks for the standalone Forge Responder booth environment.'/>
    <DemoPreflight mapboxConfigured={Boolean(process.env.MAPBOX_ACCESS_TOKEN)}/>
  </div>
}
