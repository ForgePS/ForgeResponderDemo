import PageHeader from '@views/forge-responder/PageHeader'
import HydrantForm from '@views/forge-responder/HydrantForm'
export default async function NewHydrantPage({params}:{params:Promise<{lang:string}>}){const {lang}=await params;return <div><PageHeader title='New Hydrant' description='Add a hydrant to the Forge Responder water-supply registry.'/><HydrantForm lang={lang}/></div>}
