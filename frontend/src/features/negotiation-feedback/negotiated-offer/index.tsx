import DOMPurify from 'dompurify'
import useAuth from '../../auth/use-auth'
import useNegotiationFeedback from '../_store/use-interview-feedback'
import styles from './index.module.css'

const Offer = () => {
    const { offer } = useNegotiationFeedback()
    const { user } = useAuth()

    return offer ? (
        <stack-l space="0" class={styles.wrapper}>
            <cover-l minHeight="100vh">
                <center-l>
                    <stack-l space="var(--s-1)">
                        <stack-l class={styles.card}>
                            <stack-l space="var(--s-3)">
                                <h4>Job Offer</h4>

                                <h5>{user?.get_full_name}</h5>
                            </stack-l>
                        </stack-l>

                        <stack-l
                            class={styles.card}
                            space="var(--s-5)"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(offer!),
                            }}
                        />
                    </stack-l>
                </center-l>
            </cover-l>
        </stack-l>
    ) : null
}

export default Offer
