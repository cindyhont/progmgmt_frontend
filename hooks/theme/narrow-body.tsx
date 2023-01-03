import { useTheme } from "@mui/material";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAppSelector } from "@reducers";

const useNarrowBody = () => {
    const
        {breakpoints:{up}} = useTheme(),
        matchesSM = useMediaQuery(up('sm')),
        matchesMD = useMediaQuery(up('md')),
        sidebarOpen = useAppSelector(state => state.misc.sidebarOpen)

    return !matchesSM || !matchesMD && sidebarOpen
}

export default useNarrowBody