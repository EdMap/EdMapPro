import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import DOMPurify from 'dompurify'
import { RootDispatch } from '../../app/_store'
import { Status } from '../../app/_store/state'
import useAuth from '../../auth/use-auth'
import { setShowNegotiationChat } from '../_store/reducer'
import useOfferNegotiation from '../_store/use-offer-negotiation'
import Controls from './controls'
import styles from './index.module.css'

const Offer = () => {
    const { initial_offer, offer, status } = useOfferNegotiation()
    const dispatch = useDispatch<RootDispatch>()

    const { user } = useAuth()

    const isPending = status === Status.PENDING

    const handleNegotiationStart = useCallback(() => {
        dispatch(setShowNegotiationChat())
    }, [dispatch])

    return offer || initial_offer ? (
        <stack-l space="0" className={styles.wrapper}>
            <cover-l minHeight="100vh">
                <center-l>
                    <stack-l space="var(--s-1)">
                        <stack-l className={styles.card}>
                            <stack-l space="var(--s-3)">
                                <h4>Job Offer</h4>

                                {/* TODO (hom): replace with actual offer position and name */}
                                <h5>{user?.get_full_name}</h5>
                            </stack-l>
                        </stack-l>

                        <stack-l
                            className={styles.card}
                            space="var(--s-5)"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(offer! ?? initial_offer!),
                            }}
                        />
                    </stack-l>
                </center-l>
            </cover-l>

            <Controls
                disabled={isPending}
                onNegotiation={handleNegotiationStart}
            />
        </stack-l>
    ) : null
}

export default Offer
