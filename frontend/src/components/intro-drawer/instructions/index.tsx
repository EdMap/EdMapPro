import styles from './index.module.css'

const Instructions = () => {
    return (
        <stack-l className={styles.instructions} space="var(--s-2)">
            <h3>Instructions</h3>
            <ul>
                <li>
                    Carefully read and review all the questions before
                    answering. You can record your answer or type instead.
                </li>
                <li>
                    Once you’re done with all the questions, review your answers
                    and explore tips and recommendations for each question.
                </li>
            </ul>
        </stack-l>
    )
}

export default Instructions
