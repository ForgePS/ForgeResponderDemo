import PageHeader from '@views/forge-responder/PageHeader'
import BoothToolbar from '@/components/forge-responder/BoothToolbar'
import DemoControlCenter from '@views/forge-responder/DemoControlCenter'
export default async function DemoControlPage({params}:{params:Promise<{lang:string}>}){const {lang}=await params;return <div><PageHeader title='Demo Control Center' description='Presenter launchpad and browser-local demo-session controls.'/><DemoControlCenter lang={lang}/><BoothToolbar lang={lang}/></div>}