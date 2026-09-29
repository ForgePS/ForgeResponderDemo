// MUI Imports
import Button from '@mui/material/Button'

import type { ChildrenType } from '@core/types'
import type { Locale } from '@configs/i18n'
import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import HorizontalLayout from '@layouts/HorizontalLayout'
import Providers from '@components/Providers'
import Navigation from '@components/layout/vertical/Navigation'
import Header from '@components/layout/horizontal/Header'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import HorizontalFooter from '@components/layout/horizontal/Footer'
import ScrollToTop from '@core/components/scroll-to-top'
import { i18n } from '@configs/i18n'
import { getDictionary } from '@/utils/getDictionary'
import { getMode, getSystemMode } from '@core/utils/serverHelpers'

const Layout = async (props: ChildrenType & { params: Promise<{lang:string}> }) => {
  const params=await props.params
  const {children}=props
  const lang:Locale=i18n.locales.includes(params.lang as Locale) ? params.lang as Locale : i18n.defaultLocale
  const direction=i18n.langDirection[lang]
  const dictionary=await getDictionary(lang)
  const mode=await getMode()
  const systemMode=await getSystemMode()

  return (
    <Providers direction={direction}>
      <LayoutWrapper
        systemMode={systemMode}
        verticalLayout={<VerticalLayout navigation={<Navigation dictionary={dictionary} mode={mode}/>} navbar={<Navbar/>} footer={<VerticalFooter/>}>{children}</VerticalLayout>}
        horizontalLayout={<HorizontalLayout header={<Header dictionary={dictionary}/>} footer={<HorizontalFooter/>}>{children}</HorizontalLayout>}
      />
      <ScrollToTop className='mui-fixed'>
        <Button variant='contained' className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'><i className='tabler-arrow-up'/></Button>
      </ScrollToTop>
    </Providers>
  )
}

export default Layout
