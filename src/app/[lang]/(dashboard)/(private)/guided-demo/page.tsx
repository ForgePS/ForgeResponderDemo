import PageHeader from '@views/forge-responder/PageHeader'
import GuidedDemo from '@views/forge-responder/GuidedDemo'
export default async function GuidedDemoPage({params}:{params:Promise<{lang:string}>}){const {lang}=await params;return <div><PageHeader title='Guided Demo' description='A deterministic 10-step trade-show path through Forge Responder.'/><GuidedDemo lang={lang}/></div>}